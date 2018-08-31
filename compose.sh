#!/bin/bash
export COMPOSE_PROJECT_NAME=mustache
export MUSTACHE_WORKSPACE=$1
docker-compose up --build
# python webbrowser http://127.0.0.1:5000