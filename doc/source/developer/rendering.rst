Rendering
---------

Via list of instructions. Eases testing by making things more
data-driven; alternative would be to supply a ‘renderer’ and in test
have one which just collects instructions; comes to more/less the same
thing but more functional to return a list which is then interpreted by
the real renderer. Everything seems to keep up in small projects so far
tried.

Each instance rendered according to properties: shown, x, y, size,
costume.

Rendering order
~~~~~~~~~~~~~~~

Objects are drawn from furthest-away to nearest, to ensure that nearer
objects obscure further-away ones.  This is managed by the
``DrawLayerGroup`` class.

Rendering instructions
~~~~~~~~~~~~~~~~~~~~~~

TODO: Update for speech bubbles and also variable watchers in due
course.

Currently only ‘image’. Soon have text to allow rough equivalent to
‘say’ block.

Coordinate frames
~~~~~~~~~~~~~~~~~

Scratch takes mathematical approach of centre being (0, 0) and *y* being
positive-up. So various bits of code have to transform coordinates to
cope with this. See also under stage canvas.

