import boto3
import os


def download_from_s3(bucket, key, dest):
    """Download a file from S3."""
    s3 = boto3.client('s3')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    s3.download_file(bucket, key, dest)
    print(f"✅ Downloaded {key} from s3://{bucket} to {dest}")


def upload_to_s3(file_path, bucket):
    """Upload a file to S3."""
    s3 = boto3.client('s3')
    s3.upload_file(file_path, bucket, os.path.basename(file_path))
    print(f"✅ Uploaded {file_path} to s3://{bucket}/{os.path.basename(file_path)}")
