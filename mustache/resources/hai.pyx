from __future__ import division

import numpy as np
cimport numpy as np

cimport cython

from hierarchy_tree cimport HierarchyTree

from scipy.spatial.distance import squareform, pdist

import Cython.Compiler.Options
import time

@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef np.float64_t[:, ::1] c_hai_matrix_tree(HierarchyTree[:] hs, np.int64_t n_p, np.int64_t n_h):

    cdef np.float64_t[:, ::1] d = np.zeros((n_h, n_h), dtype=np.float64)

    cdef np.int64_t[:, ::1] order = np.zeros((n_h, n_p), dtype=np.int64)

    cdef np.int64_t i = 0
    cdef np.int64_t j = 0

    cdef np.int64_t p = 0
    cdef np.int64_t pp = 0

    cdef np.int64_t x = 0

    cdef np.float64_t[:, ::1] results

    cdef HierarchyTree hi

    for p in xrange(n_p-1):
        results = np.zeros((n_h, n_p - p - 1), dtype=np.float64)
        for i in xrange(n_h):
            hi = hs[i]
            results[i] = hi.hierarchy_distance_array_tree(p)

        d += squareform(pdist(results, 'cityblock'))

    d = np.multiply(2, d)

    d = np.subtract(1, np.divide(d, (n_p*n_p)))

    return d


@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef np.float64_t[:, ::1] c_hai_matrix_euler(HierarchyTree[:] hs, np.int64_t n_p, np.int64_t n_h):

    cdef np.float64_t[:, ::1] d = np.zeros((n_h, n_h), dtype=np.float64)

    cdef np.int64_t i = 0
    cdef np.int64_t p = 0

    cdef np.float64_t[:, ::1] results

    cdef HierarchyTree hi
    cdef HierarchyTree hj

    for p in xrange(n_p-1):
        results = np.zeros((n_h, n_p - p - 1), dtype=np.float64)
        for i in xrange(n_h):
            hi = hs[i]
            results[i] = hi.hierarchy_distance_array(p)

        d += squareform(pdist(results, 'cityblock'))

    d = np.multiply(2, d)

    d = np.subtract(1, np.divide(d, (n_p*n_p)))

    return d


@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef np.float64_t[:, ::1] c_hai_matrix_euler_approx(HierarchyTree[:] hs, np.int64_t n_p, np.int64_t n_h):

    cdef np.float64_t[:, ::1] d = np.zeros((n_h, n_h), dtype=np.float64)

    cdef np.int64_t i = 0
    cdef np.int64_t p = 0

    cdef np.float64_t[:, ::1] results

    cdef HierarchyTree hi
    cdef HierarchyTree hj

    for p in xrange(n_p-1):
        results = np.zeros((n_h, n_p - p - 1), dtype=np.float64)
        for i in xrange(n_h):
            hi = hs[i]
            results[i] = hi.hierarchy_distance_array_exp(p)

        d += squareform(pdist(results, 'cityblock'))

    d = np.multiply(2, d)

    d = np.subtract(1, np.divide(d, (n_p*n_p)))

    return d


@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef np.float64_t c_hai_euler(HierarchyTree h1, HierarchyTree h2, np.int64_t n_p):
    cdef np.float64_t result = 0

    cdef np.int64_t p = 0
    cdef np.int64_t q = 0

    cdef np.float64_t[::1] results_h1
    cdef np.float64_t[::1] results_h2

    for p in xrange(n_p-1):

        results_h1 = h1.hierarchy_distance_array(p)
        results_h2 = h2.hierarchy_distance_array(p)

        for q in xrange(n_p - p-1):
            result += abs(results_h1[q] - results_h2[q])

    result = 2*result

    return 1 - result/(n_p*n_p)


@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef np.float64_t c_hai_euler_approx(HierarchyTree h1, HierarchyTree h2, np.int64_t n_p):

    cdef np.float64_t result = 0

    cdef np.int64_t p = 0
    cdef np.int64_t q = 0

    cdef np.float64_t[::1] results_h1
    cdef np.float64_t[::1] results_h2

    for p in xrange(n_p-1):

        results_h1 = h1.hierarchy_distance_array(p)
        results_h2 = h2.hierarchy_distance_array(p)

        for q in xrange(n_p - p - 1):
            result += abs(results_h1[q] - results_h2[q])

    result = 2*result

    return 1 - result/(n_p*n_p)


@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef np.float64_t c_hai_tree(HierarchyTree h1, HierarchyTree h2, np.int64_t n_p):

    cdef np.float64_t result = 0

    cdef np.int64_t p = 0
    cdef np.int64_t q = 0

    cdef np.float64_t[::1] results_h1
    cdef np.float64_t[::1] results_h2

    for p in range(n_p-1):
        results_h1 = h1.hierarchy_distance_array_tree(p)
        results_h2 = h2.hierarchy_distance_array_tree(p)

        for q in range(n_p - p - 1):
            result += abs(results_h1[q] - results_h2[q])

    result = 2*result

    return 1 - result/(n_p*n_p)


cpdef np.float64_t[:,::1] HAI_matrix_tree(HierarchyTree[:] hs, np.int64_t[:, ::1] os, np.int64_t n_p, np.int64_t n_h):
    return c_hai_matrix_tree(hs, n_p, n_h)

cpdef np.float64_t[:,::1] HAI_matrix_euler(HierarchyTree[:] hs, np.int64_t[:, ::1] os, np.int64_t n_p, np.int64_t n_h):
    return c_hai_matrix_euler(hs, n_p, n_h)

cpdef np.float64_t[:,::1] HAI_matrix_euler_approx(HierarchyTree[:] hs, np.int64_t[:, ::1] os, np.int64_t n_p, np.int64_t n_h):
    return c_hai_matrix_euler_approx(hs, n_p, n_h)

cpdef np.float64_t HAI_euler(HierarchyTree h1, HierarchyTree h2, np.int64_t n_p):
    return c_hai_euler(h1, h2, n_p)

cpdef np.float64_t HAI_euler_approx(HierarchyTree h1, HierarchyTree h2, np.int64_t n_p):
    return c_hai_euler_approx(h1, h2, n_p)

cpdef np.float64_t HAI_tree(HierarchyTree h1, HierarchyTree h2, np.int64_t[::1] o1, np.int64_t[::1] o2, np.int64_t n_p):
    return c_hai_tree(h1, h2, n_p)
