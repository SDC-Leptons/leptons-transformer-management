# Use AWS Lambda Python 3.9 base image
FROM public.ecr.aws/lambda/python:3.10
 
# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code and model
COPY app.py ./
COPY best.onnx ./

# Set the CMD to your handler (app.lambda_handler)
CMD ["app.lambda_handler"]
