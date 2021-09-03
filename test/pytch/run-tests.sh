#!/bin/bash

cd "$(realpath "$(dirname "$0")")"
exec ../../node_modules/.bin/mocha --parallel --reporter list --exclude=pytch-testing.js "$@" .
