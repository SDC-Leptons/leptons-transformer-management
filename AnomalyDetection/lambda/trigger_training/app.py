import json
import boto3
import os
from datetime import datetime

batch = boto3.client('batch')

def lambda_handler(event, context):
    # Parse request body
    body = json.loads(event.get("body", "{}"))

    job_name = f"yolo-train-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    job_queue = os.environ["BATCH_JOB_QUEUE"]
    job_definition = os.environ["BATCH_JOB_DEFINITION"]

    response = batch.submit_job(
        jobName=job_name,
        jobQueue=job_queue,
        jobDefinition=job_definition,
        containerOverrides={
            "command": [
                "python", "train.py",
                f"--train_from_s3={body.get('train_from_s3', 'false')}",
                f"--roboflow_project={body.get('roboflow_project', '')}",
                f"--roboflow_api_key={body.get('roboflow_api_key', '')}",
                f"--model={body.get('model', 'yolov8n.pt')}",
                f"--epochs={body.get('epochs', '20')}",
                f"--output_bucket={body.get('output_bucket', 'my-yolo-trained-models')}"
            ]
        }
    )

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Training job started",
            "jobId": response["jobId"]
        })
    }
