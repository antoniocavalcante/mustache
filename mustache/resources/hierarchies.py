import numpy as np

import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import matplotlib.cm as cm
import matplotlib.colors as colors

import sys

from scipy.cluster.hierarchy import dendrogram, linkage, fcluster, leaves_list, to_tree, leaders

import hdbscan

import pandas as pd

import time

from mpl_toolkits.mplot3d.axes3d import Axes3D

import seaborn as sns

import DBCV

import os

import pyximport; pyximport.install()

import hierarchy
from hierarchy_tree import HierarchyTree
import hai

from scipy.spatial import distance_matrix

from sklearn.metrics.cluster import normalized_mutual_info_score, mutual_info_score

import json

def load_hierarchies(datafile, kmin, kmax, skip):

    n_hierarchies = (kmax - kmin)/skip

    ps = no.zeros((n_hierarchies, n))

    for k in range(kmin, kmax, skip):

        hfile = basedir + '/results/' + str(k) + 'RNG_' + datafile + '.partitioning'

        h, o, s = hierarchy.load(hfile)
        r = hierarchy.get_reachability(h, o, s)
        reachability.append(r)

    return reachability, np.arange(kmin, kmax, skip)


def load_partitionings(datafile, kmin, kmax, skip):

    n_hierarchies = (kmax - kmin)/skip

    ls = []

    for k in range(kmin, kmax, skip):
        lfile = basedir + '/results/' + str(k) + 'RNG_' + datafile + '.partition'
        ls.append(np.genfromtxt(lfile, dtype=int, delimiter=','))

    return np.asarray(ls), np.arange(kmin, kmax, skip)


def load_hierarchies_hai(datafile, kmin, kmax, skip):

    n_hierarchies = (kmax - kmin)/skip

    hs = []
    os = []
    ss = []
    rr = []

    for k in range(kmin, kmax, skip):
        print basedir
        hfile = basedir + '/visualization/' + str(k) + 'RNG_' + datafile + '.hierarchy'

        # h, o, s = hierarchy.load(hfile)
        h, o, s, r = hierarchy.load(hfile)

        hs.append(h)
        os.append(o)
        ss.append(s)
        rr.append(r)

    return hs, np.array(os), ss, np.arange(kmin, kmax, skip), rr


def load_msts(datafile, kmin, kmax, skip):

    n_msts = (kmax - kmin)/skip

    msts = []

    for k in range(kmin, kmax, skip):

        mstfile = basedir + '/results/' + str(k) + 'RNG_' + datafile + '.mst'

        mst = deltacon.load_graph(mstfile)

        msts.append(mst)

    return msts


def compute_hai_matrix(hs, os, method='euler'):

    n = len(hs)

    if method == 'euler':
        return hai.HAI_matrix_euler(hs, os, len(os[0]), n)
    if method == 'tree':
        return hai.HAI_matrix_tree(hs, os, len(os[0]), n)
    if method == 'exp':
        return hai.HAI_matrix_euler_approx(hs, os, len(os[0]), n)



def plot_hai_matrix(dist, show='save', method=''):
    labels = np.arange(kmin, kmax, skip)

    im = plt.matshow(dist, extent=[min(labels), max(labels), max(labels), min(labels)])
    plt.colorbar(im, fraction=0.046, pad=0.04)

    if show == 'save':
        plt.savefig(plotdir + filename + '_hai_matrix_'+ method + '.png', dpi=600, bbox_inches='tight')
        plt.savefig(plotdir + filename + '_hai_matrix_'+ method + '.pdf', dpi=600, bbox_inches='tight')
    else:
        plt.show()

    plt.gcf().clear()



def compute_reachability(hs, os, ss, medoids):

    r = []

    for i in medoids:
        r.append(hierarchy.get_reachability(hs[i], os[i], ss[i]))

    return r


def compute_nmi_matrix(ps, show='save'):

    d = np.zeros((len(ps), len(ps)))

    for i in range(len(ps)):
        for j in range(i, len(ps)):
            if i == j:
                d[i,j] = 0
            else:
                x = 1 - normalized_mutual_info_score(ps[i], ps[j])
                # x = 1 - mutual_info_score(ps[i], ps[j])
                if x > 0:
                    d[i,j] = x
                    d[j,i] = x


    labels = np.arange(kmin, kmax, skip)

    plt.matshow(d, extent=[min(labels), max(labels), max(labels), min(labels)])
    plt.colorbar()

    if show == 'save':
        plt.savefig(plotdir + filename + '_nmi_matrix.png', bbox_inches='tight')
    else:
        plt.show()

    plt.gcf().clear()

    return d


def plot_reachability_medoids(rr, medoids, labels, partitioning, maxLabel, show='save', colormap=plt.cm.gist_rainbow):

    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')

    norm = plt.Normalize(0, maxLabel)

    # reachability = compute_reachability(hs, os, ss, medoids)
    # print medoids
    # reachability = rr[medoids]
    reachability = []
    for medoid in medoids:
        reachability.append(rr[medoid])

    n = 0
    # for c, z in zip(colormap(norm(np.arange(0, len(reachability)))), np.arange(0, len(reachability))):
    for c, z in zip(colormap(norm(partitioning)), np.arange(0, len(reachability))):
        ys = np.random.rand(n)

        cs = [c] * len(reachability[n])
        ax.bar(np.arange(len(reachability[n])), reachability[n], zs=z, zdir='y', color=c, alpha=0.9)
        n = n + 1


    # labels_reachability = np.genfromtxt("/home/toni/Dropbox/UofA/Research/Meta-clustering/data/articles/results/5RNG_articles.partition", dtype=int, delimiter=',')
    # order = np.genfromtxt("/home/toni/Dropbox/UofA/Research/Meta-clustering/data/articles/results/5RNG_articles.order", dtype=int, delimiter=',')
    # for v, p in zip(reachability[0], labels_reachability):
    #     print v, p

    # for v in range(len(reachability)):
    #     r = ""
    #     for i in reachability[v]:
    #         r = r + "," + str(i)
    #     print r

    ax.yaxis.set_ticklabels(labels)
    ax.yaxis.set_ticks(np.arange(0, len(reachability)))

    ax.set_xlabel('points')
    ax.set_ylabel('mpts')
    ax.set_zlabel('distance')

    if show == 'save':
        plt.savefig(plotdir + filename + "_" + '.pdf', dpi=600, bbox_inches='tight')
        plt.savefig(plotdir + filename + "_" + '.png', dpi=600, bbox_inches='tight')
    else:
        plt.show()

def compute_medoid(c, partitioning, h):
    a = np.where(partitioning == c)[0]
    return compute_medoid_elements(a, h)


def compute_medoid_elements(a, h):
    dist = h[a]
    return a[np.argmin(dist[:, a].sum(axis=0))]


def add_node(node, parent, labels, h):

    # Compute the medoid for node
    ids = node.pre_order(lambda x: x.id)
    medoid = compute_medoid_elements(ids, h)

    # Creates the new node and appends it to its parent's children
    newNode = dict(name=node.id, children=[], y=node.dist, medoid=labels[medoid])

    parent.setdefault("children", []).append( newNode )

    # Recursively add the current node's children
    if node.left:  add_node( node.left, newNode, labels, h )
    if node.right: add_node( node.right, newNode, labels, h )

    # If there is no node, then just set label (mpts).
    if not (node.left or node.right):
        newNode.setdefault("label", labels[node.id])


def run_hdbscan_hai(hs, labels, method='hai', show='save', cut=0, colormap=plt.cm.gist_rainbow):
    clusterer = hdbscan.HDBSCAN(metric='precomputed', match_reference_implementation=True, min_samples=1)
    clusterer.fit(hs)

    # Labels of objects as extracted from HDBSCAN*
    cluster_labels = clusterer.labels_

    print("Labels: ", cluster_labels)
    print("Unique Labels: ", np.unique(cluster_labels))

    # Linkage Matrix
    Z = clusterer.single_linkage_tree_.to_numpy()

    roots = leaders(Z, np.asarray(cluster_labels).astype('i'))

    print "Roots", map(str, roots[0])
    print "Roots", ', '.join(map(str, roots[0]))

    fosc_file = open(basedir + "/FOSC", "w+")
    fosc_file.write(', '.join(map(str, roots[0])))

    fosc_file.close()

    # Plot Settings
    # fig, ax1 = plt.subplots()
    # plt.title('HDBSCAN*')
    # plt.xlabel('mpts')
    # plt.ylabel('distance')

    # Extraction Method: FOSC or Thresholfd.
    if cut > 0:
        partitioning = fcluster(Z, cut, criterion='distance')
        # plt.axhline(y=cut, c='k')
    else:
        partitioning = cluster_labels + 1

    # Normalizes the colors according to the clusters found in the partitioning.
    norm = colors.Normalize(0, partitioning.max())

    dflt_col = "#cccccc"
    link_cols = {}
    for i, i12 in enumerate(Z[:,:2].astype(int)):
        c1, c2 = (link_cols[x] if x > len(Z) else dflt_col if partitioning[x] == 0 else colormap(norm(partitioning[x])) for x in i12)
        link_cols[i+1+len(Z)] = c1 if c1 == c2 else dflt_col

    # Creates the dendrogram.
    dendrogram(
        Z,
        leaf_rotation=90.,  # rotates the x axis labels
        leaf_font_size=6.,  # font size for the x axis labels
        labels=labels,
        count_sort=True,
        link_color_func=lambda x: colors.to_hex(link_cols[x]),
        above_threshold_color='grey'
    )

    # Saves or shows the dendrogram.
    # if show == 'save':
    #     plt.savefig(plotdir + filename + '_hdbscan_' + method + '.png', dpi=600, bbox_inches='tight')
    #     plt.savefig(plotdir + filename + '_hdbscan_' + method + '.pdf', dpi=600, bbox_inches='tight')
    # else:
    #     plt.show()

    # Clears plot.
    # plt.gcf().clear()

    clusters, _ = np.unique(partitioning, return_counts=True)

    h = np.array(hs)

    medoids = []

    for c in clusters:
        if c != 0:
            medoids.append(compute_medoid(c, partitioning, h))

    medoids.sort()


    # Linkage Matrix in a Tree Format
    T = to_tree(Z)

    d3Dendro = dict(name=T.id, y=T.dist)

    add_node(T, d3Dendro, labels, h)
    json.dump(d3Dendro, open(resudir + filename + '_meta-hierarchy_.json', "w"), sort_keys=True, indent=4)

    return medoids, labels[medoids], partitioning[medoids], clusters.max()


def run_hdbscan(hs, mpts, labels, metric):
    clusterer = hdbscan.HDBSCAN(min_cluster_size=mpts, min_samples=mpts, metric=metric, gen_min_span_tree=True, match_reference_implementation=True)
    cluster_labels = clusterer.fit_predict(hs)

    # clusterer.single_linkage_tree_.plot(cmap='viridis', colorbar=True, axis='matplotlib')
    Z = clusterer.single_linkage_tree_.to_numpy()

    # fig, ax1 = plt.subplots()
    #
    # plt.title('HDBSCAN* - mpts: ' + str(mpts) + " - " + metric)
    # plt.xlabel('mpts')
    # plt.ylabel('distance')

    dbcv = np.zeros((kmax - kmin)/skip)

    # for i in range(kmin, kmax, skip):
    #     dbcv[i-kmin] = compute_DBCV(basedir + '/' + filename, resudir + '/' + filename + '_partition_' + str(i) + '.csv')

    r = dendrogram(
        Z,
        leaf_rotation=90.,  # rotates the x axis labels
        leaf_font_size=8.,  # font size for the x axis labels
        labels=labels,
        count_sort=True
    )

    cut = 2
    partitioning = fcluster(Z, cut, criterion='distance')
    # plt.axhline(y=cut, c='k')
    clusters = np.unique(partitioning)

    h = np.array(hs)

    medoids = []

    for c in clusters:
        a = np.where(partitioning == c)[0]
        objects = h[a]
        dist = distance_matrix(objects, objects)
        medoids.append(h[np.argmin(dist.sum(axis=0))])

    plt.savefig(plotdir + filename + "_" + method + "_" + metric + '.png')
    plt.show()
    plt.gcf().clear()

    return medoids

def run_hierarchical(hs, labels, method, metric):
    Z = linkage(hs, method, metric, optimal_ordering=True)

    fig, ax1 = plt.subplots()

    plt.title('Hierarchical Clustering Dendrogram: ' + method + ', ' + metric)
    plt.xlabel('mpts')
    plt.ylabel('Distance')

    r = dendrogram(
        Z,
        leaf_rotation=90.,  # rotates the x axis labels
        leaf_font_size=8.,  # font size for the x axis labels
        labels=labels
    )

    cut = 2
    partitioning = fcluster(Z, cut, criterion='distance')
    plt.axhline(y=cut, c='k')
    clusters = np.unique(partitioning)

    h = np.array(hs)

    medoids = []

    for c in clusters:
        a = np.where(partitioning == c)[0]
        objects = h[a]
        dist = distance_matrix(objects, objects)
        medoids.append(hs[np.argmin(dist.sum(axis=0))])

    plt.savefig(plotdir + filename + "_" + method + "_" + metric + '.png')
    plt.show()
    plt.gcf().clear()

    return medoids


def myplot(hs):
    xsize, ysize = hs.shape
    x = np.arange(0, ysize, 1)
    y = np.arange(0, xsize, 1)

    xs, ys = np.meshgrid(x, y)
    z = hs

    fig = plt.figure()

    # ax = fig.add_subplot(2, 1, 1, projection='3d')
    ax = fig.gca(projection='3d')
    ax.plot_surface(xs, ys, z, color="blue", alpha=1, rstride=1, cstride=1)

    plt.tight_layout

    plt.savefig('surface.png')

    # plt.show()


def correlation(hs, labels):

    hs2 = np.asarray(hs, dtype=np.float32)

    c = np.corrcoef(hs2)

    plt.matshow(c, extent=[min(labels), max(labels), max(labels), min(labels)])
    # plt.matshow(c)
    plt.colorbar()
    plt.savefig(plotdir + filename + '_correlation.png')
    # plt.show()


def correlation_dendrogram(hs):
    c = np.corrcoef(hs)

    sns.clustermap(c, center=0, cmap="vlag", linewidths=.75, figsize=(13, 13))
    # plt.matshow(c)
    plt.colorbar()
    # plt.savefig('correlation.png')
    plt.show()


def compute_DBCV(datafile, labelsfile):
    data, labels, clusters, nclusters, psize = DBCV.load(datafile, labelsfile)

    return DBCV.DBCV(data, labels, clusters, psize)


# kmin = 2
# kmax = 50
skip = 1

basedir = os.path.dirname(sys.argv[1])
filename = os.path.basename(sys.argv[2])

kmin = int(os.path.basename(sys.argv[3]))
kmax = int(os.path.basename(sys.argv[4]))

resudir = basedir + '/visualization/'
plotdir = basedir + '/plots/'

t = time.time()

hs, os, ss, mpts, rr = load_hierarchies_hai(filename, kmin, kmax, skip)

# ps, mpts = load_partitionings(filename, kmin, kmax, skip)
# # msts = load_msts(filename, kmin, kmax, skip)
print("Loading Time: " + str(time.time() - t))

hs_tree = np.empty(len(hs), dtype=HierarchyTree)

t = time.time()
for i in range(len(hs)):
    hs_tree[i] = HierarchyTree(hs[i], os[i])

print("Create Trees: " + str(time.time() - t))

m = 'tree'

t = time.time()
dist = compute_hai_matrix(hs_tree, os, method=m)

# Saving the HAI matrix to file.
np.savetxt(resudir + filename + '_HAI_' + m + '.out', dist, delimiter=',')

# dist = compute_nmi_matrix(ps)
print("Distance Matrix Time: " + str(time.time() - t))
# plot_hai_matrix(dist, method=m)

t = time.time()

global_colormap = plt.cm.rainbow

medoids, labels, partitioning, maxLabel = run_hdbscan_hai(np.subtract(1, dist), mpts, cut=0, colormap=global_colormap)

print("Clustering Time: " + str(time.time() - t))
