FROM ultralytics/ultralytics:latest

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

ENV AWS_DEFAULT_REGION=ap-southeast-1

CMD ["python", "train.py"]
