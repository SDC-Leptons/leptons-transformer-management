aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 851725220076.dkr.ecr.ap-southeast-1.amazonaws.com
docker build -t software_project-train .
docker tag software_project-train:latest 851725220076.dkr.ecr.ap-southeast-1.amazonaws.com/software_project:train-latest
docker push 851725220076.dkr.ecr.ap-southeast-1.amazonaws.com/software_project:train-latest