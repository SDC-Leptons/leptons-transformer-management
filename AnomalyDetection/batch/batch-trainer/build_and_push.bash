aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 851725220076.dkr.ecr.ap-southeast-1.amazonaws.com
docker build -t software_project-sagemaker .
docker tag software_project-sagemaker:latest 851725220076.dkr.ecr.ap-southeast-1.amazonaws.com/software_project:sagemaker-latest
docker push 851725220076.dkr.ecr.ap-southeast-1.amazonaws.com/software_project:sagemaker-latest