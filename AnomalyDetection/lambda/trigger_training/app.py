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
    activate_job = os.environ.get("ACTIVATE_JOB", "true")
    if activate_job.lower() != "true":
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Job activation skipped",
                "jobId": None
            })
        }

    response = batch.submit_job(
        jobName=job_name,
        jobQueue=job_queue,
        jobDefinition=job_definition,
    )

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Training job started",
            "jobId": response["jobId"]
        })
    }
