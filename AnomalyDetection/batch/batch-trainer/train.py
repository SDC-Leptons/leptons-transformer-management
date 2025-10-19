import argparse
import os
import sys
import boto3
from ultralytics import YOLO
from roboflow import Roboflow

sys.path.append("utils")
from s3_utils import download_from_s3, upload_to_s3


def main():
    parser = argparse.ArgumentParser(description="YOLO Training Job for AWS Batch")

    parser.add_argument("--train_from_s3", type=str, default="false",
                        help="If true, download dataset from S3, else from Roboflow")
    parser.add_argument("--roboflow_project", type=str, default="", help="Roboflow project name")
    parser.add_argument("--roboflow_version", type=int, default=5, help="Roboflow version number")
    parser.add_argument("--roboflow_workspace", type=str, default="", help="Roboflow workspace name")
    parser.add_argument("--roboflow_api_key", type=str, default="", help="Roboflow API key")
    parser.add_argument("--model", type=str, default="yolov11s.pt", help="Base YOLO model")
    parser.add_argument("--epochs", type=int, default=20, help="Number of epochs")
    parser.add_argument("--output_bucket", type=str, default="my-yolo-trained-models",
                        help="S3 bucket to upload results")
    parser.add_argument("--dataset_s3_bucket", type=str, default="my-yolo-datasets")
    parser.add_argument("--dataset_s3_key", type=str, default="dataset.zip")
    parser.add_argument("--base_weights_s3", type=str, default="",
                    help="S3 path to base weights (e.g., s3://bucket/path/best.pt)")


    args = parser.parse_args()

    os.makedirs("datasets", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)

    # Step 1: Download dataset
    if args.train_from_s3.lower() == "true":
        print("📦 Downloading dataset from S3...")
        download_from_s3(args.dataset_s3_bucket, args.dataset_s3_key, "datasets/dataset.zip")
        os.system("unzip -q datasets/dataset.zip -d datasets")
        dataset_path = "datasets"
    else:
        print("🌐 Downloading dataset from Roboflow...")
        rf = Roboflow(api_key=args.roboflow_api_key)
        project = rf.workspace(args.workspace).project(args.roboflow_project)
        dataset = project.version(args.project_version).download("yolov11")
        dataset_path = dataset.location
        
    base_weights_local = args.model  # default: local yolov8n.pt

    if args.base_weights_s3:
        # Parse bucket and key from S3 URI
        if not args.base_weights_s3.startswith("s3://"):
            raise ValueError("base_weights_s3 must start with s3://")
        _, _, path = args.base_weights_s3.partition("s3://")[2].partition("/")
        bucket = path.split("/")[0]
        key = "/".join(path.split("/")[1:])
        base_weights_local = "base_weights.pt"
        from utils.s3_utils import download_from_s3
        print(f"📥 Downloading base weights from {args.base_weights_s3}")
        download_from_s3(bucket, key, base_weights_local)


    # Step 2: Train YOLO
    print("🚀 Starting YOLO training...")
    model = YOLO(base_weights_local)
    model.train(data=f"{dataset_path}/data.yaml", epochs=args.epochs, imgsz=640)

    # Step 3: Export ONNX
    print("🔄 Exporting model to ONNX...")
    onnx_path = model.export(format="onnx", dynamic=True)
    final_onnx_path = os.path.join("outputs", os.path.basename(onnx_path))
    os.rename(onnx_path, final_onnx_path)

    # Step 4: Upload to S3
    print("☁️ Uploading trained model to S3...")
    upload_to_s3(final_onnx_path, args.output_bucket)
    print("✅ Training job completed successfully!")


if __name__ == "__main__":
    main()
