Sounds
------

There is a distinction between a ``Sound``, which contains all the data
to describe a sound, and a ``SoundPerformance``, which represents one
occasion of playing some sound. These map fairly closely to the Web
Audio concepts of ``AudioBuffer`` and ``AudioBufferSource``
respectively.

Mix buses
~~~~~~~~~

We want to mimic the Scratch behaviour of each individual sprite
instance having its own volume, which can be set independently, and
which controls the gain of all (possibly concurrent) sounds played by
that sprite instance.  In Pytch, the model is that when a sprite
instance starts playing a sound, it does so into a "mix bus"
associated with that sprite instance.  Each mix bus has a gain, which
has a default value of 1.0, and can be set and read.  Gains less than
0.0 or greater than 1.0 should not be used; this mimics Scratch
behaviour.

A mix bus is identified by its *name*, a string.  Pytch uses the
sprite-instance's ``info_label`` for this, which consists of the class
name and a numeric instance ID joined with a hyphen.

Global "sound manager" object
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

There is a Skulpt/Pytch-global ``sound_manager`` object.  It keeps
track of a collection of mix buses, ensuring that each one has its own
gain.  The object provides methods:

-  ``async_load_sound(tag, url_or_path)`` — return (a Promise resolving
   to) a ``Sound`` object

-  ``stop_all_performances()`` — cancel all running
   ``SoundPerformance``\ s

-  ``reset()`` — set the sound-manager's state such that it is as if it
   was freshly constructed

-  ``set_mix_bus_gain(mix_bus_name, gain)`` — set the gain of the
   mixing bus with the given ``mix_bus_name`` to ``gain``

-  ``get_mix_bus_gain(mix_bus_name)`` — return the gain of the mixing
   bus with the given ``mix_bus_name``

-  ``one_frame()`` — do whatever housekeeping is required internally for
   the sound-manager

The environment (test or browser) is responsible for calling
``one_frame()``; we don’t do this in the ``Project``, to separate these
concerns, and in case we ever have multiple concurrent projects.

``Sound`` object
~~~~~~~~~~~~~~~~

Created by the sound-manager’s ``async_load_sound()`` method. Has the
single method

-  ``launch_new_performance(mix_bus_name)`` — create and start playing
   a new performance of this sound on the mixing bus with the given
   ``mix_bus_name``

and the property

-  ``tag`` — a short human-useful string for diagnostic purposes, set
   from the ``tag`` argument to ``async_load_sound()``

``SoundPerformance`` object
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Created by the ``launch_new_performance()`` method of a ``Sound``. Has
the properties

-  ``tag`` — diagnostic tag for human consumption; the ``tag`` of the
   ``Sound`` of which this is a performance

-  ``has_ended`` — indicates whether the performance has ended or not
   (if not, the performance is still going)

and the single method

-  ``stop()`` — interrupt the performance, stopping any noise, and
   marking the performance as having ended

It is not an error to call ``stop()`` on an already-ended performance.

Registration of sounds
~~~~~~~~~~~~~~~~~~~~~~

An actor (sprite or stage) Python class should have a class-level
attribute ``Sounds`` which is a list of 2-element tuples (*name*,
*url*). The *url* should point to a sound file of supported format. The
*name* is used in Actor methods to be described next.

Actor methods for playing sounds
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

An actor has the sound-related methods

-  ``self.start_sound(name)`` — launch a new performance of the given
   sound, and continue execution of the current thread immediately

-  ``self.play_sound_until_done(name)`` — launch a new performance of
   the given sound, and pause the calling thread’s execution until the
   sound has finished playing

Implemented via a syscall which uses the global sound-manager. The
‘until done’ variant puts the thread to sleep; the has_ended property is
polled to know when to wake it.

Sound manager separate one-frame() call; serves pretty different
purposes in test and real; not fully convinced this is a clean design;
could have instead had the project’s one-frame() call the
sound-manager’s but kept separate in case ever have more than one
project.

Real browser-based sound-manager
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sound is async-loaded by decoding from array-buffer, and creating Sound
from it. Sound can create buffer-source, which is wrapped in
sound-performance.

Small wrinkle because can’t create running audio-context without user
gesture, so have to defer creating sound-manager (with its
audio-context) until first ‘BUILD’ click.

Red-flag stops all sounds, which means we need to track all running
performances. Add them to list when launched. One-frame culls all
completed performances from that list.

Testing / mock sound-manager
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Knows how many frames to wait before declaring a performance ‘done’. The
one_frame() method allows the sound-manager to count elapsed frames.
