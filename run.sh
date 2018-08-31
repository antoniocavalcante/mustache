#!/bin/bash
# docker run --name mustache -d -p 5000:5000 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix -v /home/csaba/Documents/datasets:/app/data csaba/mustache 
export COMPOSE_PROJECT_NAME=mustache
export MUSTACHE_WORKSPACE=$1
echo "Starting Application.."
docker-compose up -d 
xdg-open http://127.0.0.01:5000

