from __future__ import division

import os
import re
import sys

import numpy as np

import hutil
from clustertree import ClusterTree


class MDClusterTree:

    def __init__(self, dataset, kmin, kmax):
        self.ctdict = {}

        self.similar = {}
        self.next = {}

        self.dataset = dataset
        self.kmin = kmin
        self.kmax = kmax

        self.load(dataset, kmin, kmax)

        self.connect(kmin, kmax)

    def __str__(self):
        return ""

    # Loads all cluster trees for the range of mpts given as input.
    def load(self, dataset, kmin, kmax):

        for mpts in range(kmin, kmax + 1):
            self.ctdict[mpts] = ClusterTree(dataset, mpts)

            self.similar[mpts] = {}
            self.next[mpts] = {}

        return self.ctdict

    def propagate(self):
        # if the split occurs in a node of the hierarchy with the smaller mpts,
        # then it needs to be propagated backwards, to split its parent in the
        # transposed hierarchy.

        return 0

    def find_similar(self, id, mpts):
        if mpts + 1 not in self.ctdict.keys():
            return

        cluster = self.ctdict[mpts].get(id)
        root = self.ctdict[mpts + 1].root()

        similarity = 0
        points = self.ctdict[mpts].points(cluster.id)

        check = [root.id]
        current_node = root

        while check:
            c = check.pop()
            current_similarity = elements_overlap(points, self.ctdict[mpts + 1].points(c))
            if current_similarity > similarity:
                similarity = current_similarity
                current_node = c
                check.extend(self.ctdict[mpts + 1].get(c).children)

        return current_node

    def find_next(self, cluster, mpts):
        # Checks if the hierarchy for mpts + 1 exists in the collection.
        if mpts + 1 not in self.ctdict.keys(): return

        # Checks that the cluster being analyzed is not None.
        if cluster is None: return

        # Retrieves the points that compose cluster at its birth level.
        points = self.ctdict[mpts].points(cluster)

        # Initializes the expansion queue with the root.
        expand = [self.ctdict[mpts + 1].root()]

        while expand:
            c = expand.pop()

            if c.birth < cluster.death:
                pass

            if not level_overlap(c, cluster):
                expand.extend(c.children)
                pass

            points_c = self.ctdict[mpts + 1].points(c, level=cluster.birth)

            if elements_overlap(points, points_c):
                cluster.childrenT.append(c)
                expand.extend(c.children)

        return cluster.childrenT

    def connect(self, kmin, kmax):

        for mpts in range(kmin, kmax):
            for _, clusters in self.ctdict[mpts].tree.items():
                for cluster in clusters:
                    # self.similar[mpts][cluster] = self.find_similar(cluster[0], mpts)
                    if cluster is not None:
                        self.find_next(cluster, mpts)
                        self.next[mpts][cluster.id] = [c.id for c in cluster.childrenT]

    def store(self):
        import json
        
        with open(os.path.dirname(self.dataset) + "/" + os.path.basename(self.dataset) + "-t-" + str(self.kmin) + "-" + str(self.kmax) + ".json" , "w") as write_file:
            json.dump(self.next,
                      write_file,
                      indent = 4)

        return 0


def elements_overlap(clusterA, clusterB):
    if clusterA is None or clusterB is None: return 0
    intersection = np.intersect1d(clusterA, clusterB)
    return len(intersection) / min(len(clusterA), len(clusterB))


def level_overlap(clusterA, clusterB):
    return not (clusterA.death >= clusterB.birth or
                clusterB.death >= clusterA.birth)


if __name__ == '__main__':
    mdct = MDClusterTree(sys.argv[1], 2, int(sys.argv[2]))
    mdct.store()
