MustaCHE | Multiple Clustering Hierarchies Explorer
==============

.. image:: docs/overview.png

----

MustaCHE, a tool that allows analysis and exploration of multiple clustering hierarchies (w.r.t. a set of mpts values) in an interactive and visual manner. Its main overall goals are to assist the user to (1) (visually) find “good” valuesfor mpts and (2) to understand which cluster structures arepresent w.r.t. different density parameters in the data. 

1. `Examples & Usage <#1-examples--usage>`_
2. `Installation <#2-installation--setup>`_
3. `Background & Research <#3-background--research>`_
4. `Troubleshooting <#4-troubleshooting-problems>`_
5. `Frequent Questions <#5-frequent-questions>`_

|Python Version|

1. Examples & Usage
===================

2. Installation & Setup
=======================

Manual Installation [developers]
-------------------------------------

This project requires Python 3.4+ and you'll also need ``numpy`` and ``scipy`` (numerical computing libraries) as well as ``python3-dev`` installed system-wide.  If you want more detailed instructions, follow these:

1. `Linux Installation of Lasagne <https://github.com/Lasagne/Lasagne/wiki/From-Zero-to-Lasagne-on-Ubuntu-14.04>`_ **(intermediate)**
2. `Mac OSX Installation of Lasagne <http://deeplearning.net/software/theano/install.html#mac-os>`_ **(advanced)**
3. `Windows Installation of Lasagne <https://github.com/Lasagne/Lasagne/wiki/From-Zero-to-Lasagne-on-Windows-7-%2864-bit%29>`_ **(expert)**

Afterward fetching the repository, you can run the following commands from your terminal to setup a local environment:

.. code:: bash

    # Create a local environment for Python 3.x to install dependencies here.
    python3 -m venv pyvenv --system-site-packages

    # If you're using bash, make this the active version of Python.
    source pyvenv/bin/activate

    # Setup the required dependencies simply using the PIP module.
    python3 -m pip install --ignore-installed -r requirements.txt

3. Background & Research
========================

4. Troubleshooting Problems
===========================

.. |Python Version| image:: http://aigamedev.github.io/scikit-neuralnetwork/badge_python.svg
    :target: https://www.python.org/

.. |License Type| image:: https://img.shields.io/badge/license-AGPL-blue.svg
    :target: https://github.com/alexjc/neural-enhance/blob/master/LICENSE

.. |Project Stars| image:: https://img.shields.io/github/stars/alexjc/neural-enhance.svg?style=flat
    :target: https://github.com/alexjc/neural-enhance/stargazers
