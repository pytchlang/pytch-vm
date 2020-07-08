#!/bin/bash

exec ../../node_modules/.bin/mocha-parallel-tests --reporter list --exclude=pytch-testing.js "$@" .
