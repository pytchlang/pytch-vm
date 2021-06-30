..
   To set up for standalone development:

   At root of repo:

      virtualenv -p python3 venv
      source venv/bin/activate
      pip install sphinx sphinx-rtd-theme sphinx-autobuild

   Then, within "doc/" directory,

      sphinx-autobuild --re-ignore '/\.#' source build/html

   will launch a live-reload server to view the results.  See the developer docs
   for the pytch-website repository for how to build these docs into the main
   website docs.


The Pytch VM and IDE
====================

.. caution::

   This index will not appear in the final website documentation.  It is just
   for standalone development of the VM docs.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   user/index
   developer/index
