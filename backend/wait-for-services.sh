#!/bin/sh

#DOCKER_HOST=$(docker-machine ip)
DOCKER_HOST="127.0.0.1"
HOST=${1:-$DOCKER_HOST}

set -eu pipefail

echo "Attempting to connect to mongodb"
until $(nc -zv $HOST 27017); do
    printf '.'
    sleep 5
done
echo "Attempting to connect to redis"
until $(nc -zv $HOST 6379); do
    printf '.'
    sleep 5
done
echo "Was able to connect to all"

exit 0