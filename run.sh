#!/bin/bash
export COMPOSE_PROJECT_NAME=mustache
export MUSTACHE_WORKSPACE=/home/csaba/Documents/datasets
docker-compose up -d
sleep 3
xdg-open http://127.0.0.01:5000