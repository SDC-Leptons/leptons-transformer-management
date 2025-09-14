import json
import base64
import cv2
import numpy as np
import onnxruntime as ort

# Load model once (global)
model_path = "best.onnx"
onnx_model = ort.InferenceSession(model_path)

# COCO classes
classes = [
    "person","bicycle","car","motorcycle","airplane","bus","train","truck","boat","traffic light",
    "fire hydrant","stop sign","parking meter","bench","bird","cat","dog","horse","sheep","cow",
    "elephant","bear","zebra","giraffe","backpack","umbrella","handbag","tie","suitcase","frisbee",
    "skis","snowboard","sports ball","kite","baseball bat","baseball glove","skateboard","surfboard",
    "tennis racket","bottle","wine glass","cup","fork","knife","spoon","bowl","banana","apple",
    "sandwich","orange","broccoli","carrot","hot dog","pizza","donut","cake","chair","couch",
    "potted plant","bed","dining table","toilet","tv","laptop","mouse","remote","keyboard","cell phone",
    "microwave","oven","toaster","sink","refrigerator","book","clock","vase","scissors","teddy bear",
    "hair drier","toothbrush"
]

def lambda_handler(event, context):
    try:
        # Decode image from base64
        body = json.loads(event.get("body", "{}"))
        if "image" not in body:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing 'image' key in request body."})
            }
            
        img_data = base64.b64decode(body["image"])
        np_arr = np.frombuffer(img_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        img_h, img_w = image.shape[:2]

        # Preprocess
        img = cv2.resize(image, (640, 640))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.transpose(2, 0, 1)
        img = img / 255.0
        img = img.astype(np.float32)
        img = np.expand_dims(img, axis=0)

        # Inference
        outputs = onnx_model.run(None, {"images": img})
        results = outputs[0].transpose((0, 2, 1))[0]

        # Filter detections
        filtered = []
        for det in results:
            class_id = det[4:].argmax()
            conf = det[4:].max()
            if conf > 0.5:
                filtered.append(np.concatenate([det[:4], [class_id, conf]]))
        filtered = np.array(filtered)

        # Rescale to original image
        if filtered.shape[0] == 0:
            return {"statusCode": 200, "body": json.dumps({"detections": []})}

        cx, cy, w, h, cls, conf = filtered[:, 0], filtered[:, 1], filtered[:, 2], filtered[:, 3], filtered[:, 4], filtered[:, 5]
        cx = cx / 640.0 * img_w
        cy = cy / 640.0 * img_h
        w = w / 640.0 * img_w
        h = h / 640.0 * img_h
        x1 = (cx - w / 2).astype(int)
        y1 = (cy - h / 2).astype(int)
        x2 = (cx + w / 2).astype(int)
        y2 = (cy + h / 2).astype(int)

        detections = []
        for i in range(len(x1)):
            detections.append({
                "class": classes[int(cls[i])],
                "confidence": float(conf[i]),
                "box": [int(x1[i]), int(y1[i]), int(x2[i]), int(y2[i])]
            })

        return {
            "statusCode": 200,
            "body": json.dumps({"detections": detections})
        }

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
