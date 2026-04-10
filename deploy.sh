#!/bin/bash

docker compose down
sudo rm -rf dist
git pull
npm install
npm run build
docker compose up -d
