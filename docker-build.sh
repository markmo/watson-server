#!/usr/bin/env bash
$(aws ecr get-login --no-include-email --region ap-southeast-2 --profile=telstra)
docker build --build-arg HTTP_PROXY=http://10.200.10.1:8080 --build-arg HTTP_PROXYS=http://10.200.10.1:8080  -t 839890008239.dkr.ecr.ap-southeast-2.amazonaws.com/tbots/watson-proxy:latest .
docker push 839890008239.dkr.ecr.ap-southeast-2.amazonaws.com/tbots/watson-proxy:latest
