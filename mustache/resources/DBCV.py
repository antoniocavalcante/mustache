from __future__ import division

import sys
import time
import numpy as np
import math
import mpmath as mp

from scipy.spatial.distance import euclidean
from scipy.sparse.csgraph import minimum_spanning_tree
from scipy.spatial.distance import pdist, squareform


def load(datafile, labelsfile):
    # Load Dataset
    data = np.genfromtxt(datafile, delimiter=',')
    # Load Labels
    labels = np.genfromtxt(labelsfile, dtype=int, delimiter=',')
    # Unique Cluster Labels
    clusters = np.sort(np.unique(labels))
    # Number of Clusters
    nclusters = clusters.size
    # Size of original partitioning
    psize = labels.size
    # Removes noise from data and from labels
    data = data[labels != 0]
    labels = labels[labels != 0]
    clusters = clusters[clusters != 0]

    # Finds how many elements there are in each cluster
    unique, counts = np.unique(labels, return_counts=True)
    d = dict(zip(unique, counts))

    # Removes singleton clusters
    for u, c in d.items():
        if c == 1:
            data = data[labels != u]
            labels = labels[labels != u]
            clusters = clusters[clusters != u]


    label = 0
    for cluster in clusters:
        labels[labels == cluster] = label
        clusters[clusters == cluster] = label
        label += 1

    # Compute size of each cluster

    return data, labels, clusters, nclusters, psize


def allPointsCoreDistance(Ci):
    # Dimensions
    d = Ci[0].size
    # Number of elements in cluster Ci
    ni = len(Ci)

    # Distance matrix
    distances = squareform(pdist(Ci, 'sqeuclidean'))

    with np.errstate(divide='ignore'):
        knn = distances**(-d)

    knn[knn == np.inf] = 0

    apcd = np.sum(knn, axis=0)

    apcd = (apcd/(ni - 1))**(-1/d)

    mrd = np.zeros((ni, ni))

    for p in range(ni):
        for q in range(p + 1, ni):
            mrd[p, q] = max(apcd[p], apcd[q], distances[p, q])
            mrd[q, p] = mrd[p, q]

    return apcd, mrd


# def allPointsCoreDistance(Ci):
#     # Dimensions
#     d = Ci[0].size
#     # Number of elements in cluster Ci
#     ni = len(Ci)
#
#     # Distance matrix
#     distances = squareform(pdist(Ci, 'sqeuclidean'))
#
#     # with np.errstate(divide='ignore'):
#     knn = distances
#
#     knn[knn == np.inf] = 0
#
#     apcd = np.sum(knn, axis=0)
#
#     apcd = (apcd/(ni - 1))**(-1)
#
#     mrd = np.zeros((ni, ni))
#
#     for p in range(ni):
#         for q in range(p + 1, ni):
#             mrd[p, q] = max(apcd[p], apcd[q], distances[p, q])
#
#     return apcd, mrd


def APCD(data, labels, clusters):
    apcd = np.arange(clusters.size, dtype=object)
    mrd = np.arange(clusters.size, dtype=object)

    for i in range(clusters.size):
        apcd[i], mrd[i] = allPointsCoreDistance(getCluster(i, data, labels))

    return apcd, mrd


def MSTofCi(i, data, labels, apcd, m):
    x = getCluster(i, data, labels)
    mrd = m[i]

    mst = minimum_spanning_tree(mrd, overwrite=True).toarray().astype(float)
    internal_edges = np.copy(mst)

    internal_nodes = []
    external_nodes = []

    for e in range(len(mst)):
        degree = np.count_nonzero(mst[e, :]) + np.count_nonzero(mst[:, e])

        if degree == 1:
            external_nodes.append(e)
        else:
            internal_nodes.append(e)

    internal_edges[external_nodes, :] = 0
    internal_edges[:, external_nodes] = 0

    if np.count_nonzero(internal_edges) == 0:
        internal_edges = np.copy(mst)

    if np.count_nonzero(internal_nodes) == 0:
        internal_nodes = np.arange(len(x))

    return internal_edges, x, internal_nodes


def MSTs(data, labels, clusters, apcd, m):
    edges = np.arange(clusters.size, dtype=object)
    x = np.arange(clusters.size, dtype=object)
    nodes = np.arange(clusters.size, dtype=object)

    for i in clusters:
        edges[i], x[i], nodes[i] = MSTofCi(i, data, labels, apcd, m)

    return edges, x, nodes


# Density Separation of a Pair of Clusters
def DSPC(data, labels, clusters, e, nodes, apcd):
    dspc = np.empty(len(clusters))
    dspc.fill(np.inf)

    for m in range(len(clusters)):

        i = clusters[m]

        Ci = e[i]
        ICi = nodes[i]

        apcd_i = apcd[i]

        Ci = Ci[ICi]
        apcd_i = apcd_i[ICi]

        for n in range(m, len(clusters)):
            j = clusters[n]

            if i != j:
                Cj = e[j]
                ICj = nodes[j]

                apcd_j = apcd[j]
                Cj = Cj[ICj]
                apcd_j = apcd_j[ICj]

                x = np.zeros((len(Ci), len(Cj)))

                for p in range(len(Ci)):
                    for q in range(len(Cj)):
                        x[p, q] = max(apcd_i[p], apcd_j[q],
                                      euclidean(Ci[p], Cj[q])**2)

        if x.size > 0:
            dspc[i] = min(dspc[i], x.min())

    return dspc


# Density Sparseness of a Cluster
def DSC(data, labels, clusters, edges):
    dsc = np.zeros(len(clusters))

    for i in clusters:
        mst_i = edges[i]

        if dsc[i] == 0:
            if mst_i.size > 0:
                dsc[i] = np.amax(mst_i)

    return dsc


# Validity index of a Cluster
def VC(dsc, dspc, i):
    vc = mp.fdiv((dspc[i] - dsc[i]), max(dspc[i], dsc[i]))

    if math.isnan(vc):
        return 0
    else:
        return vc


def getCluster(i, data, labels):
    return data[np.where(labels == i)]


# Density Based Clustering Validation
def DBCV(data, labels, clusters, psize):

    # If there is 0 (everything is noise) or a single cluster, return 0.
    if len(clusters) < 2:
        return 0

    # All-Points Core Distance and MRD of each element of each cluster.
    apcd, mrd = APCD(data, labels, clusters)

    # MST of each cluster.
    edges, x, nodes = MSTs(data, labels, clusters, apcd, mrd)

    # Density Sparseness of every cluster.
    dsc = DSC(data, labels, clusters, edges)

    # Density Separation of every Pair of Clusters.
    dspc = DSPC(data, labels, clusters, x, nodes, apcd)

    index = 0.0

    for i in clusters:
        index += (len(getCluster(i, data, labels))/psize)*VC(dsc, dspc, i)

    return index


# start = time.time()
#
# data, labels, clusters, nclusters, psize = load(sys.argv[1], sys.argv[2])
#
# print "Number of points: ", len(data)
# print "Number of dimensions: ", data[0].size
# print "Number of clusters: ", nclusters
#
# print DBCV(data, labels, clusters, psize)
#
# total = time.time() - start
# print "Running Time: ", total

# print "Silhouette"
# silhouette_avg = silhouette_score(data, labels)
#
# print silhouette_avg
