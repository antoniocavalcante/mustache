from __future__ import division

import numpy as np
cimport numpy as np

cimport cython

cdef class HierarchyTree:
    # Number of points in the hierarchy.
    cdef np.int64_t n
    # n_levels holds the number of nodes in the tree.
    cdef np.int64_t n_nodes
    # n_levels holds the number of levels in the tree.
    cdef np.int64_t n_levels
    # n_levels holds the number of levels in the tree.

    cdef np.int64_t* levels
    # parent[i] holds the parent of node i in the tree.
    cdef np.int64_t* parent
    # depth[i] holds the depth of node i in the tree.
    cdef np.int64_t[::1] depth
    # depth[i] holds the depth of node i in the tree.
    cdef np.int64_t[::1] order
    cdef np.int64_t[::1] reverse

    # depth[i] holds the depth of node i in the tree.
    cdef np.int64_t[:, ::1] nodes

    cdef np.int64_t[::1] leaf
    # children[i] holds a list with the children of node i.
    cdef list[:] children

    # index[i] holds the deeper node in which element order[i] appears.
    cdef np.int64_t[::1] index
    # euler_path holds the Euler Path of the tree.

    cdef np.int64_t[::1] euler_path
    # euler_path holds the Euler Path of the tree.
    cdef np.int64_t[::1] euler_depth

    # FAI[i] holds the first appearence of node i in the Euler Path.
    cdef np.int64_t[::1] FAI
    # e holds the current position in the Euler Tour.
    cdef np.int64_t e
    # Sparse Table for RMQ
    cdef np.int64_t[:, ::1] lookup
    # cdef np.int64_t** lookup

    # Holds the powers of 2.
    cdef np.int64_t[::1] power2
    # Holds the log of n.
    cdef np.int64_t[::1] logn

    cdef np.float64_t[::1] result

    cdef np.int64_t previous

    # Methods
    # def __init__(self, list hierarchy)

    cdef np.int64_t insert(self, np.int64_t, np.int64_t, np.int64_t, np.int64_t)

    cdef count_nodes_levels(self, list)

    cdef np.int64_t search(self, np.int64_t)

    cdef np.int64_t get_parent(self, np.int64_t)

    cdef tuple get_node(self, np.int64_t)

    cdef np.int64_t search_insert(self, np.int64_t, np.int64_t)

    cdef euler(self, np.int64_t)

    cdef np.int64_t[::1] get_path(self)

    cdef np.int64_t[::1] get_depth(self)

    cdef preprocess(self, np.int64_t)

    cdef np.int64_t query(self, np.int64_t, np.int64_t)

    cdef np.int64_t LCA(self, np.int64_t, np.int64_t)

    cpdef np.float64_t hierarchy_distance(self, np.int64_t, np.int64_t)

    cdef np.float64_t[::1] hierarchy_distance_array(self, np.int64_t)

    cdef np.float64_t[::1] hierarchy_distance_array_exp(self, np.int64_t)

    cdef np.float64_t[::1] hierarchy_distance_array_tree(self, np.int64_t)
