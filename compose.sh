#!/bin/bash

echo "Building Application.."
export COMPOSE_PROJECT_NAME=mustache
export MUSTACHE_WORKSPACE=$1

mkdir -p $1
chmod -R a+rwx $1

> run.sh
echo "#!/bin/bash" >> run.sh
echo "export COMPOSE_PROJECT_NAME=mustache" >> run.sh
echo "export MUSTACHE_WORKSPACE=$1" >> run.sh
echo "docker-compose up -d" >> run.sh
echo "sleep 3" >> run.sh

chmod +x run.sh

docker-compose build --compress
