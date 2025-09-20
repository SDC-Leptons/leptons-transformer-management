import json
import base64
import numpy as np
import onnxruntime as ort

# --- Load Model Once (Cold Start Optimization) ---
model_path = "best.onnx"  # adjust path for Lambda layer or /tmp if uploaded
onnx_model = ort.InferenceSession(model_path)

# Replace with your class names (must match your training dataset)
classes = ['Full wire overload', 'Loose Joint - Faulty', 'Loose Joint - Potential', 'Point Overload - Faulty', 'Normal']

# --- Helper Functions ---
def filter_detections(results, thresh=0.5):
    num_outputs = results.shape[1]

    if num_outputs == 5:  # single-class [cx, cy, w, h, conf]
        cx, cy, w, h, conf = results[:, 0], results[:, 1], results[:, 2], results[:, 3], results[:, 4]
        class_ids = np.zeros_like(conf, dtype=int)
        mask = conf > thresh
        return np.stack([cx[mask], cy[mask], w[mask], h[mask], class_ids[mask], conf[mask]], axis=1)

    else:  # multi-class
        filtered = []
        for det in results:
            cx, cy, w, h = det[:4]
            scores = det[4:]
            class_id = scores.argmax()
            confidence = scores[class_id]
            if confidence > thresh:
                filtered.append([cx, cy, w, h, class_id, confidence])
        return np.array(filtered) if filtered else np.empty((0, 6))

def nms(boxes, scores, iou_thresh=0.55):
    if len(boxes) == 0:
        return []
    x1, y1, x2, y2 = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()
    keep = []
    while order.size > 0:
        i = order[-1]
        keep.append(i)
        order = order[:-1]
        if order.size == 0:
            break
        xx1 = np.maximum(x1[i], x1[order])
        yy1 = np.maximum(y1[i], y1[order])
        xx2 = np.minimum(x2[i], x2[order])
        yy2 = np.minimum(y2[i], y2[order])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        union = areas[i] + areas[order] - inter
        iou = inter / union
        order = order[iou < iou_thresh]
    return keep

def rescale_boxes(results, img_w, img_h):
    if results.shape[0] == 0:
        return np.empty((0, 4)), np.array([]), np.array([])

    cx, cy, w, h, class_id, conf = results[:, 0], results[:, 1], results[:, 2], results[:, 3], results[:, 4], results[:, 5]
    cx = cx / 640.0 * img_w
    cy = cy / 640.0 * img_h
    w = w / 640.0 * img_w
    h = h / 640.0 * img_h
    x1 = cx - w / 2
    y1 = cy - h / 2
    x2 = cx + w / 2
    y2 = cy + h / 2

    boxes = np.stack([x1, y1, x2, y2], axis=1)
    keep = nms(boxes, conf)
    return boxes[keep], class_id[keep], conf[keep]

# --- Lambda Handler ---
def lambda_handler(event, context):
    try:
        # Expect base64 image in body (API Gateway should pass binary as base64)
        body = json.loads(event["body"])
        img_data = base64.b64decode(body["image"])
        np_img = np.frombuffer(img_data, np.uint8)

        import cv2
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        img_h, img_w = image.shape[:2]

        # Preprocess
        img = cv2.resize(image, (640, 640))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.transpose(2, 0, 1) / 255.0
        img = img.astype(np.float32)[None, :, :, :]

        # Inference
        outputs = onnx_model.run(None, {"images": img})
        results = outputs[0].transpose((0, 2, 1))[0]

        # Postprocess
        filtered = filter_detections(results)
        boxes, class_ids, confidences = rescale_boxes(filtered, img_w, img_h)

        detections = []
        for box, cls_id, conf in zip(boxes, class_ids, confidences):
            x1, y1, x2, y2 = box.tolist()
            detections.append({
                "class_id": int(cls_id),
                "class_name": classes[int(cls_id)],
                "confidence": float(conf),
                "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
            })

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"detections": detections})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
