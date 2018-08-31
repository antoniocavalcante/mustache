#!/bin/bash
echo "Building Application.."
export COMPOSE_PROJECT_NAME=mustache
export MUSTACHE_WORKSPACE=$1
mkdir -p $1
chmod a+rwx $1
docker-compose build --compress -d


