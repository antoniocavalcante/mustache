#!/bin/bash

echo "Building Application.."
export COMPOSE_PROJECT_NAME=mustache
export MUSTACHE_WORKSPACE=$1

mkdir -p $1
chmod -R a+rwx $1

> start.sh
echo "#!/bin/bash" >> start.sh
echo "export COMPOSE_PROJECT_NAME=mustache" >> start.sh
echo "export MUSTACHE_WORKSPACE=$1" >> start.sh
echo "docker-compose up -d" >> start.sh
echo "sleep 3" >> start.sh

chmod +x start.sh

docker-compose build --compress
