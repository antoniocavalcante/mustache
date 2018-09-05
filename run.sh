#!/bin/bash
export COMPOSE_PROJECT_NAME=mustache
export MUSTACHE_WORKSPACE=
docker-compose up -d
xhost +
sleep 3
xdg-open http://127.0.0.01:5000
