import json
import cv2
import numpy as np
import onnxruntime as ort
import base64
import tempfile
import os

# --- Load Model at Lambda Cold Start ---
MODEL_PATH = "best.onnx"

onnx_model = ort.InferenceSession(MODEL_PATH)

# Example classes (replace with your own classes)
classes = ['Full wire overload', 'Loose Joint - Faulty', 'Loose Joint - Potential', 'Point Overload - Faulty', 'Normal']

def filter_detections(results, thresh=0.5):
    if results.shape[1] == 5:  # Single class model
        mask = results[:, 4] > thresh
        if not np.any(mask):
            return np.empty((0, 6))
        detections = results[mask]
        class_id = np.zeros((detections.shape[0], 1))  # class id = 0 for single class
        return np.hstack([detections[:, :4], class_id, detections[:, 4:5]])
    else:
        filtered = []
        for det in results:
            class_id = det[4:].argmax()
            confidence = det[4:].max()
            if confidence > thresh:
                filtered.append(np.concatenate([det[:4], [class_id, confidence]]))
        return np.array(filtered) if len(filtered) > 0 else np.empty((0, 6))

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

def rescale_boxes(results, img_w, img_h, iou_thresh=0.55):
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
    scores = conf
    keep = nms(boxes, scores, iou_thresh)
    return boxes[keep], class_id[keep], scores[keep]

def lambda_handler(event, context):
    try:
        # --- Parse Input ---
        body = json.loads(event.get("body", "{}"))
        image_b64 = body.get("image")
        threshold = float(body.get("threshold", 0.5))  # ✅ Default threshold = 0.5
        iou_threshold = float(body.get("iou_threshold", 0.5))  # ✅ Default IoU threshold = 0.5
        print(f"Received threshold: {threshold}, IoU threshold: {iou_threshold}")
        if not image_b64:
            return {"statusCode": 400, "body": json.dumps({"error": "No image provided"})}

        # --- Decode Image ---
        image_data = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        img_h, img_w = image.shape[:2]

        # Preprocess
        img = cv2.resize(image, (640, 640))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.transpose(2, 0, 1) / 255.0
        img = np.expand_dims(img.astype(np.float32), axis=0)

        # Inference
        outputs = onnx_model.run(None, {"images": img})
        results = outputs[0].transpose((0, 2, 1))[0]

        results = filter_detections(results, threshold)
        boxes, class_ids, confidences = rescale_boxes(results, img_w, img_h, iou_thresh=iou_threshold)

        detections = []
        for box, cls_id, conf in zip(boxes, class_ids, confidences):
            detections.append({
                "box": [float(b) for b in box],
                "class": classes[int(cls_id)],
                "confidence": float(conf)
            })

        return {
            "statusCode": 200,
            "body": json.dumps({"detections": detections})
        }

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
