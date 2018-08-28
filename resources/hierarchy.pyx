import sys

import numpy as np
cimport numpy as np

cimport cython

import re

cpdef load(datafile):
    return load_fast(datafile)


@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
@cython.initializedcheck(False)
cdef load_fast(datafile):

    cdef list scale = []
    cdef list order = []

    cdef dict clusters = {}

    cdef np.int64_t i = 0
    cdef np.int64_t k = 0
    cdef tuple v

    cdef str line = ""
    cdef list level = []
    # cdef np.int64_t[::1] level

    with open(datafile, "rb") as f:
        # Reads the order of the points.
        order = f.readline().strip().split(',')

        reachability = np.zeros(len(order), dtype=np.float64)

        # Parses the lines of the hierarchies.
        for line in f:
            level = line.strip().replace(':',',').split(',')

            scale.append(float(level[0]))
            density_level = float(level[0])

            level = ','.join(level[1:]).replace('-', ',').split(',')

            for i in xrange(0, len(level), 3):
                # pass
                k = int(level[i])
                v = (int(level[i+1]), int(level[i+2]))
                try:
                    clusters[k].add(v)
                except KeyError:
                    clusters[k] = set({v})

                # for u in xrange(v[0], v[1]):
                    # if reachability[u] >

                reachability[v[0] + 1: v[1] + 1] = density_level

    reachability[0] = max(reachability) + (max(reachability) - min(reachability))/10;
    reachability[reachability == 0] = scale[0]

    return clusters, np.array(order, dtype=np.int64), scale, reachability


@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
@cython.initializedcheck(False)
cdef load_compact(datafile):

    cdef list scale = []
    cdef list order = []

    cdef dict clusters = {}

    cdef np.int64_t i = 0
    cdef np.int64_t k = 0
    cdef tuple v

    # cdef FILE *f

    cdef str line = ""
    cdef list level = []
    # cdef np.int64_t[::1] level

    with open(datafile, "rb") as f:
        # Reads the order of the points.
        order = f.readline().strip().split(',')

        # Parses the lines of the hierarchies.
        for line in f:
            level = line.strip().replace(':',',').split(',')

            scale.append(float(level[0]))

            level = ','.join(level[1:]).replace('-', ',').split(',')

            for i in xrange(0, len(level), 3):
                # pass
                k = int(level[i])
                v = (int(level[i+1]), int(level[i+2]))

                if k not in clusters:
                    clusters[k] = set({v})

    return clusters, np.array(order, dtype=np.int64), scale


cpdef get_reachability(hierarchy, order, scale):

    reachability = np.zeros(len(order))

    for j in range(len(scale)-2, 1, -1):
        for k in range(1, len(hierarchy[j]), 3):
            if np.count_nonzero(reachability[hierarchy[j][k] + 1 : hierarchy[j][k+1]]) < (hierarchy[j][k+1] - hierarchy[j][k] - 1):
                for i in range(hierarchy[j][k] + 1, hierarchy[j][k+1] + 1):
                    if reachability[i] == 0:
                        reachability[i] = scale[j-1]

    reachability[0] = max(reachability) + (max(reachability) - min(reachability))/10;
    reachability[reachability == 0] = scale[0]

    return reachability
