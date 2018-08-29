from distutils.core import setup
from distutils.extension import Extension
from Cython.Build import cythonize

import numpy

extensions = [
    Extension(
        "hierarchy",
        ["hierarchy.pyx"],
        extra_compile_args = ["-ffast-math"],
        include_path=[numpy.get_include()]
    ),
    Extension(
        "hierarchy_tree",
        ["hierarchy_tree.pyx"],
        extra_compile_args = ["-ffast-math"],
        include_path=[numpy.get_include()]
    ),
    Extension(
        "hai",
        ["hai.pyx"],
        extra_compile_args = ["-ffast-math"],
        include_path=[numpy.get_include()]
    )
]

setup(
    name='hai',
    ext_modules=cythonize(extensions),
    include_path=[numpy.get_include()]
)
