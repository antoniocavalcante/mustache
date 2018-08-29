from __future__ import division

import numpy as np
cimport numpy as np

from libc.stdlib cimport malloc, free
cimport cython

from operator import itemgetter

# import Cython.Compiler.Options

from math import log, ceil

import time

cdef class HierarchyTree:

    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    def __init__(self, dict hierarchy, np.int64_t[::1] order):

        # Counts the number of nodes in the tree.
        self.n_nodes = sum(len(subclusters) for subclusters in hierarchy.values())
        # self.count_nodes_levels(hierarchy)

        # Auxiliary variables to hold the intervals of a node.
        # cdef np.int64_t first, last
        #
        # first, last = hierarchy[0][1], hierarchy[0][2]

        self.n = len(order)

        # Initializes the array of parents.
        self.parent = <np.int64_t*> malloc(sizeof(np.int64_t) * (self.n_nodes))

        # Initializes the array of depth.
        self.depth = np.zeros(self.n_nodes, dtype=np.int64)

        self.nodes = np.empty((self.n_nodes, 2), dtype=np.int64)

        self.leaf  = np.ones(self.n_nodes, dtype=np.int64)

        self.children = np.empty(self.n_nodes, dtype=list)

        for node in xrange(self.n_nodes):
            self.children[node] = []

        self.index = np.zeros(self.n, dtype=np.int64)

        self.reverse = np.zeros(self.n, dtype=np.int64)
        # self.reverse = <np.int64_t*> malloc(sizeof(np.int64_t) * (self.n))

        # self.levels = <np.int64_t*> malloc(sizeof(np.int64_t) * (self.n_levels))
        #
        # for level in xrange(self.n_levels):
        #     self.levels[level] = 0

        self.result = np.zeros(self.n-1, dtype=np.float64)

        self.previous = self.n + 1

        # Loop Variable

        self.order = order

        cdef np.int64_t i = 0

        for i in xrange(self.n):
            self.reverse[order[i]] = i

        for i in xrange(self.n_nodes):
            self.parent[i] = -1

        # Insert the root of the tree in position 0.
        self.parent[0] = 0
        self.depth[0] = 0

        cdef np.int64_t k = 0
        cdef np.int64_t c = 0
        cdef np.int64_t add = 0

        for cluster in hierarchy.values():
            w = sorted(sorted(cluster, key=itemgetter(1), reverse=True), key=itemgetter(0))

            low, high = w[0][0], w[0][1]

            self.nodes[c,0] = low
            self.nodes[c,1] = high

            # seach for parent of this cluster.
            self.parent[c] = self.search_insert(low, high)

            if self.parent[c] != c:
                self.children[self.parent[c]].append(c)
                self.leaf[self.parent[c]] = 0

            self.depth[c] = self.depth[self.parent[c]] + 1

            self.index[w[0][0]:w[0][1]+1] = c

            c = c + 1

            for low, high in w[1:]:
                self.nodes[c,0] = low
                self.nodes[c,1] = high

                self.index[low:high+1] = c

                # if self.parent[c] == -1:
                self.parent[c] = c-1
                self.children[c-1].append(c)

                self.leaf[c-1] = 0

                self.depth[c] = self.depth[c-1] + 1

                c = c + 1

        # for i in xrange(len(self.nodes)):
        #     print "node: ", i, ": ", self.nodes[i,0],self.nodes[i,1], "parent: ", self.parent[i]
        #
        # for i in xrange(len(self.index)):
        #     print "index ", i, self.index[self.reverse[i]], self.reverse[i]

        # for i in xrange(1, self.n_levels):
        #   # Insert all nodes in the tree.
        #     for k in xrange(1, len(hierarchy[i]), 3):
        #         add = self.insert(hierarchy[i][k], hierarchy[i][k+1], c, i)
        #
        #         if add == 1:
        #             c = c + 1

        # Releasing Memory
        free(self.levels)

        # Initializes the arrays that hold the Euler Path.
        cdef np.int64_t s = 2*self.n_nodes - 1

        self.euler_path = np.zeros(s, dtype=np.int64)
        # self.euler_path = <np.int64_t*> malloc(sizeof(np.int64_t) * (s))

        self.euler_depth = np.zeros(s, dtype=np.int64)
        # self.euler_depth = <np.int64_t*> malloc(sizeof(np.int64_t) * (s))

        self.FAI = np.zeros(self.n_nodes, dtype=np.int64)
        # self.FAI = <np.int64_t*> malloc(sizeof(np.int64_t) * (self.n_nodes))

        self.lookup = np.zeros((int(ceil(log(s, 2))), s), dtype=np.int64)

        # Variable to hold the position of the Euler Tour.
        self.e = 0
        # Constructs the Euler Tour from node 0: root.
        self.euler(0)

        # Memorizes all needed powers of 2 in an array.
        cdef np.int64_t size = int(log(s, 2) + 1) + 1

        self.power2 = np.zeros(size, dtype=np.int64)

        self.logn = np.zeros(s, dtype=np.int64)

        self.power2[0] = 1;

        for i in xrange(1, size):
            self.power2[i] = self.power2[i-1]*2;

        # Memorizing all log(n) values
        cdef np.int64_t val = 1
        cdef np.int64_t ptr = 0

        for i in xrange(1, s):
            self.logn[i] = ptr-1;
            if (val == i):
                val*=2
                self.logn[i] = ptr
                ptr = ptr + 1

        self.preprocess(s)

    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef np.int64_t insert(self, np.int64_t first, np.int64_t last, np.int64_t c, np.int64_t i):
        cdef np.int64_t s = 0

        # for s in xrange(c-1, self.levels[i-1]-1, -1):

        s = self.search_insert(first, last)

        # for s in xrange(c-1, -1, -1):
            # if ((first > self.nodes[s, 0] and last < self.nodes[s, 1]) or
            #    (first >= self.nodes[s, 0] and last < self.nodes[s, 1]) or
            #    (first > self.nodes[s, 0] and last <= self.nodes[s, 1])):
            # if first >= self.nodes[s, 0] and last <= self.nodes[s, 1]:
        if s != -1:
            pass
            self.parent[c] = s
            self.leaf[s] = 0

            self.depth[c] = i

            self.nodes[c, 0] = first
            self.nodes[c, 1] = last

            self.children[self.parent[c]].append(c)

            self.index[first:last+1] = c

            if self.levels[i] == 0:
                self.levels[i] = c

            return 1

        return 0


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef count_nodes_levels(self, list hierarchy):
        cdef np.int64_t n_levels = len(hierarchy)

        cdef np.int64_t n_nodes = 0

        cdef np.int64_t i = 0
        cdef np.int64_t k = 0

        for i in xrange(0, n_levels):
            for k in xrange(1, len(hierarchy[i]), 3):
                n_nodes += 1

        self.n_nodes  = n_nodes
        self.n_levels = n_levels
        # return n_nodes, n_levels


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef np.int64_t search(self, np.int64_t p):
        return self.index[p]


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef np.int64_t get_parent(self, np.int64_t p):
        return self.parent[p]


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef tuple get_node(self, np.int64_t p):
        return (self.nodes[p, 0], self.nodes[p, 1])


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef np.int64_t search_insert(self, np.int64_t first, np.int64_t last):

        cdef np.int64_t current = 0

        cdef np.int64_t t = 0

        keep = True

        while keep:

            keep = False

            for t in self.children[current]:
                if first >= self.nodes[t, 0] and last <= self.nodes[t, 1]:
                    current = t
                    keep = True
                    break

        return current


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef euler(self, np.int64_t p):

        self.euler_path[self.e]  = p
        self.euler_depth[self.e] = self.depth[p]

        if self.FAI[p] == 0:
            self.FAI[p] = self.e

        self.e = self.e + 1

        for child in self.children[p]:
            self.euler(child)

            self.euler_path[self.e]  = p
            self.euler_depth[self.e] = self.depth[p]

            self.e = self.e + 1


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef np.int64_t[::1] get_path(self):
        return self.euler_path


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef np.int64_t[::1] get_depth(self):
        return self.euler_depth


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef preprocess(self, np.int64_t n):

        cdef np.int64_t i = 0
        cdef np.int64_t j = 0
        cdef np.int64_t x = 0
        cdef np.int64_t y = 0

        # Initialize M for the intervals with length 1
        for i in range(n):
            self.lookup[0, i] = i

        j = 1
        # Compute values from smaller to bigger intervals
        while self.power2[j] <= n:
            # Compute minimum value for all intervals with size 2^j
            i = 0
            while (i + self.power2[j] - 1) < n:
                x = self.euler_depth[self.lookup[j-1, i]]
                y = self.euler_depth[self.lookup[j-1, i + self.power2[j-1]]]

                if (x < y):
                    self.lookup[j, i] = self.lookup[j-1, i]
                else:
                    self.lookup[j, i] = self.lookup[j-1, i + self.power2[j-1]]

                # self.lookup[j, i] = min(self.lookup[j-1, i], self.lookup[j-1, i + self.power2[j-1]])

                i = i + 1
            j = j + 1


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef inline np.int64_t query(self, np.int64_t l, np.int64_t r):

        if l == r:
            return l

        cdef np.int64_t dx = self.logn[r - l]

        cdef np.int64_t a = self.lookup[dx, l]
        cdef np.int64_t b = self.lookup[dx, r - self.power2[dx]]

        # return min(a, b)

        if (self.euler_depth[a] > self.euler_depth[b]):
            return b
        else:
            return a


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef np.int64_t LCA(self, np.int64_t u, np.int64_t v):

        if u == v:
           return u

        if (self.FAI[u] > self.FAI[v]):
            # print "Query: ", self.query(self.FAI[v], self.FAI[u])
            # print "Euler Path: ", self.euler_path[self.query(self.FAI[v], self.FAI[u])]
            # print "Size of Euler Path: ", len(self.euler_path)
            return self.euler_path[self.query(self.FAI[v], self.FAI[u])]
        else:
            # print "Query: ",self.query(self.FAI[u], self.FAI[v])
            # print "Euler Path: ",self.euler_path[self.query(self.FAI[u], self.FAI[v])]
            # print "Size of Euler Path: ", len(self.euler_path)
            return self.euler_path[self.query(self.FAI[u], self.FAI[v])]


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cpdef np.float64_t hierarchy_distance(self, np.int64_t a, np.int64_t b):
        cdef np.int64_t pa = self.reverse[a]
        cdef np.int64_t pb = self.reverse[b]

        cdef np.int64_t i = self.LCA(self.index[pa], self.index[pb])

        # If i is the smallest node in which both points a and b are together
        # in the hierarchy, then the distance between them is 0.
        if self.index[pa] == self.index[pb] and self.leaf[self.index[pa]] == 1:
            return 0

        return (self.nodes[i, 1] - self.nodes[i, 0] + 1)/self.n


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef np.float64_t[::1] hierarchy_distance_array(self, np.int64_t a):
        cdef np.int64_t pa = self.reverse[a]
        cdef np.int64_t b
        cdef np.int64_t pb
        cdef np.int64_t i = 0

        cdef np.int64_t node = self.index[pa]

        cdef np.float64_t[::1] result = np.zeros(self.n-a-1, dtype=np.float64)
        total = 0
        total2 = 0
        total3 = 0

        cdef np.int64_t u = 0
        cdef np.int64_t v = 0

        cdef np.int64_t q1 = 0
        cdef np.int64_t q2 = 0

        u = self.FAI[node]

        for b in xrange(a+1, self.n):

            pb = self.reverse[b]

            if self.index[pa] == self.index[pb]:
                if self.leaf[self.index[pa]] == 1:
                    result[b-a-1] = 0
                else:
                    result[b-a-1] = (self.nodes[self.index[pa], 1] - self.nodes[self.index[pa], 0] + 1)/self.n
                continue

            v = self.FAI[self.index[pb]]

            if (u > v):
                q1 = self.query(v, u)
                i = self.euler_path[q1]
            else:
                q2 = self.query(u, v)
                i = self.euler_path[q2]

            result[b-a-1] = (self.nodes[i, 1] - self.nodes[i, 0] + 1)/self.n

        return result


    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    @cython.initializedcheck(False)
    cdef np.float64_t[::1] hierarchy_distance_array_exp(self, np.int64_t a):
        cdef np.int64_t pa = self.reverse[a]
        cdef np.int64_t b
        cdef np.int64_t pb
        cdef np.int64_t i = 0

        cdef np.int64_t node_a = self.index[pa]
        cdef np.int64_t node_b

        cdef np.float64_t[::1] result = np.zeros(self.n-a-1, dtype=np.float64)

        cdef np.int64_t u = 0
        cdef np.int64_t v = 0

        cdef np.int64_t q1 = 0
        cdef np.int64_t q2 = 0

        u = self.FAI[node_a]

        for b in xrange(a+1, self.n):

            pb = self.reverse[b]
            node_b = self.index[pb]

            if node_a == node_b:
                if self.leaf[node_a] != 1:
                    result[b-a-1] = (self.nodes[node_a, 1] - self.nodes[node_a, 0] + 1)/self.n
                continue

            v = self.FAI[node_b]

            if (u > v):
                i = self.euler_path[self.query(v, u)]
                # i = self.query(v, u)
            else:
                i = self.euler_path[self.query(u, v)]
                # i = self.query(u, v)

            result[b-a-1] = (self.nodes[i, 1] - self.nodes[i, 0] + 1)/self.n

        return result

    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    cdef np.float64_t[::1] hierarchy_distance_array_tree(self, np.int64_t a):

        cdef np.int64_t pa = self.reverse[a]

        cdef np.int64_t first = 0
        cdef np.int64_t last = 0

        cdef np.int64_t b = 0

        cdef np.int64_t gap_start = pa
        cdef np.int64_t gap_stop = pa

        cdef np.int64_t x = 0

        cdef np.int64_t node = self.index[pa]

        first, last = self.nodes[node, 0], self.nodes[node, 1]

        # Checks if the first node where point a appears is a leaf.
        for x in xrange(first, last + 1):
            b = self.order[x]
            if b > a:
                node_b = self.index[x]
                if node == node_b:
                    if self.leaf[node] == 0:
                        self.result[b-1] = (last - first + 1)/self.n
                    else:
                        self.result[b-1] = 0
                else:
                    self.result[b-1] = (last - first + 1)/self.n

        gap_start = first
        gap_stop = last

        while node != 0:

            node = self.parent[node]
            first, last = self.nodes[node, 0], self.nodes[node, 1]

            for x in xrange(first, gap_start):
                b = self.order[x]
                if b > a:
                    self.result[b-1] = (last - first + 1)/self.n

            for x in xrange(gap_stop + 1, last + 1):
                b = self.order[x]
                if b > a:
                    self.result[b-1] = (last - first + 1)/self.n

            gap_start = first
            gap_stop = last

            if self.previous >= first and self.previous <= last:
                self.previous = pa
                return self.result[a:]

        # print result

        # for e in self.result[a+1:]:
        #     print e
        # print '-----'

        self.previous = pa
        return self.result[a:]
