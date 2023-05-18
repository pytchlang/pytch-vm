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

At the end of each ``one_frame()`` call, the client will typically ask
the project how to render the now-current state of the project.  This
is done via the ``rendering_instructions()`` method on ``Project``.
The return value is a list of instructions, of various kinds:

RenderImage
  The given image should be painted at the given location with the
  given scale and rotation (about the given centre).

RenderSpeechBubble
  A speech bubble should be drawn with the given content, and with its
  tip at the given location.  A “speaker ID” is provided as an
  efficiency optimisation, so that the client can track whether a
  given bubble is the same as in the previous frame, should replace an
  existing bubble, or is a new bubble.

RenderAttributeWatcher
  An “attribute watcher” (much like Scratch’s “variable watcher”)
  should be drawn at the given location with the given label and
  content.  Similarly to the speaker-ID of a *RenderSpeechBubble*
  instruction, a “key” is provided to identify updates to “the same”
  watcher.

Coordinate frames
~~~~~~~~~~~~~~~~~

Scratch takes mathematical approach of centre being (0, 0) and *y* being
positive-up. So various bits of code have to transform coordinates to
cope with this. See also under stage canvas.

