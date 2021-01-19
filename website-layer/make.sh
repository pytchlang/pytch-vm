#!/bin/bash

if [ -z "$PYTCH_DEPLOYMENT_ID" ]; then
    echo "PYTCH_DEPLOYMENT_ID must be set"
    exit 1
fi

BUILD_DIR="$(realpath "$(dirname "$0")")"
REPO_ROOT="$(realpath "$BUILD_DIR"/..)"

cd "$REPO_ROOT"

LAYER_DIR=website-layer/layer-content
SKULPT_DIR="$LAYER_DIR"/skulpt/"$PYTCH_DEPLOYMENT_ID"

if [ -e node_modules -o -e $LAYER_DIR ]; then
    echo "Must be run in a clean clone"
    echo '(i.e., no "node_modules" or "'"$LAYER_DIR"'")'
    exit 1
fi

npm install
npm run build

mkdir -p "$SKULPT_DIR"

(
    cd dist
    cp --target-directory=../"$SKULPT_DIR" \
           skulpt.min.js \
           skulpt.min.js.map \
           skulpt-stdlib.js
)

(
    cd "$LAYER_DIR"
    find skulpt -type d -print0 | xargs -0 chmod 755
    find skulpt -type f -print0 | xargs -0 chmod 644
    zip -r ../layer.zip skulpt
)
