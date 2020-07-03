#!/bin/bash

exec ../../node_modules/mocha/bin/mocha --reporter list --exclude=pytch-testing.js "$@" .
