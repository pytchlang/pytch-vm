#!/bin/bash

exec ../../node_modules/.bin/mocha --parallel --reporter list --exclude=pytch-testing.js "$@" .
