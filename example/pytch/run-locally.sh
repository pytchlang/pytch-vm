#!/bin/bash

[ -e skulpt.js ] || ln -s ../../dist/skulpt.js
[ -e skulpt.min.js ] || ln -s skulpt.js skulpt.min.js
[ -e skulpt-stdlib.js ] || ln -s ../../dist/skulpt-stdlib.js

exec python3 -c "
from http.server import test, SimpleHTTPRequestHandler as RH
RH.extensions_map = {k: v + ';charset=UTF-8'
                     for k, v in RH.extensions_map.items()}
test(RH, port=8124)
"
