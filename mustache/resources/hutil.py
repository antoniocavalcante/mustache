import os
import numpy as np


def tree_path(dataset, i):
    return os.path.dirname(dataset) + "/visualization/" + str(i) + "RNG_" + os.path.basename(dataset) + ".tree"


def hierarchy_path(dataset, i):
    return os.path.dirname(dataset) + "/visualization/" + str(i) + "RNG_" + os.path.basename(dataset) + ".hierarchy"


def mst_path(dataset, i):
    return os.path.dirname(dataset) + "/visualization/" + str(i) + "RNG_" + os.path.basename(dataset) + ".mst"


def rng_path(dataset, i):
    return os.path.dirname(dataset) + "/visualization/" + str(i) + "RNG_" + os.path.basename(dataset) + ".rng"


def get_tree(dataset, i):
    # Loads and returns the cluster tree.
    return 0


def get_hierarchy(dataset, i):
    # Loads and returns the hierarchy.
    return 0


def get_mst(dataset, i):
    # Loads and returns the minimum spanning tree.
    return np.genfromtxt(mst_path(dataset, i), dtype=None, delimiter=' ')


def get_rng(dataset, i):
    # Loads and returns the relative neighborhood graph.
    return np.genfromtxt(rng_path(dataset, i), dtype=int, delimiter=' ')
