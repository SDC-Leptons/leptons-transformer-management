import os
import sys
import boto3
from ultralytics import YOLO
from roboflow import Roboflow

sys.path.append("utils")
from download_corrections import download_recorrected_annotations
from s3_utils import download_from_s3, upload_to_s3

def main():
    # Fetching environment variables (using defaults if not set)
    train_from_s3 = os.environ.get("TRAIN_FROM_S3", "false").lower()
    roboflow_project = os.environ.get("ROBOFLOW_PROJECT", "")
    roboflow_version = int(os.environ.get("ROBOFLOW_VERSION", 5))
    roboflow_workspace = os.environ.get("ROBOFLOW_WORKSPACE", "")
    roboflow_api_key = os.environ.get("ROBOFLOW_API_KEY", "f8FjMAFaWdQQbPnvGaPV")
    model = os.environ.get("MODEL", "yolov11s.pt")
    epochs = int(os.environ.get("EPOCHS", 20))
    output_bucket = os.environ.get("OUTPUT_BUCKET", "my-yolo-trained-models")
    dataset_s3_bucket = os.environ.get("DATASET_S3_BUCKET", "my-yolo-datasets")
    dataset_s3_key = os.environ.get("DATASET_S3_KEY", "dataset/data.zip")
    base_weights_s3 = os.environ.get("BASE_WEIGHTS_S3", "")

    os.makedirs("dataset", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)
    os.makedirs("weights", exist_ok=True)

    # Step 1: Download dataset
    if train_from_s3 == "true":
        print("Downloading dataset from S3...")
        download_from_s3(dataset_s3_bucket, dataset_s3_key, "dataset/data.zip")
        os.system("unzip -q dataset/data.zip -d dataset")
        download_recorrected_annotations()
        dataset_path = "dataset"
    else:
        print("Downloading dataset from Roboflow...")
        rf = Roboflow(api_key=roboflow_api_key)
        project = rf.workspace(roboflow_workspace).project(roboflow_project)
        dataset = project.version(roboflow_version).download("yolov11")
        dataset_path = dataset.location
    
    base_weights_local = model  # default: local yolov8n.pt

    if base_weights_s3 != "":
        # Parse bucket and key from S3 URI
        if not base_weights_s3.startswith("s3://"):
            raise ValueError("base_weights_s3 must start with s3://")
        _, _, path = base_weights_s3.partition("s3://")[2].partition("/")
        key = "models/previous/best.pt"
        base_weights_local = "weights/best.pt"
        print(f"📥 Downloading base weights from {base_weights_s3}")
        download_from_s3(dataset_s3_bucket, key, base_weights_local)

    # Step 2: Train YOLO
    print("🚀 Starting YOLO training...")
    model = YOLO(base_weights_local)
    model.train(data=f"{dataset_path}/data/data.yaml", epochs=epochs, imgsz=640,workers=1)

    # Step 3: Export ONNX
    print("🔄 Exporting model to ONNX...")
    onnx_path = model.export(format="onnx", dynamic=True)
    print(f"✅ Model exported to {onnx_path}")
    final_onnx_path = os.path.join("outputs", os.path.basename(onnx_path))
    os.rename(onnx_path, final_onnx_path)
    print(f"✅ Moved ONNX model to {final_onnx_path}")

    # Step 4: Upload to S3
    print("☁️ Uploading trained model to S3...")
    upload_to_s3(final_onnx_path, dataset_s3_bucket)
    print("✅ Training job completed successfully!")

if __name__ == "__main__":
    main()
