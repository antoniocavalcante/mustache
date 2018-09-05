import numpy as np

# import matplotlib.pyplot as plt
# import matplotlib.cm as cm
# import matplotlib.colors as colors
#
# matplotlib.use('Agg')

import sys

import argparse

import hierarchy

import time

import pandas as pd

start = time.time()

hfile = sys.argv[1]
lfile = sys.argv[2]
print "Loading hierarchy..."
h, o, s, r = hierarchy.load(hfile)

print "Loading labels..."
labels = np.genfromtxt(lfile, dtype=int, delimiter=',')

print 'Loading Time: ', time.time() - start

start = time.time()

reachability = r

x = labels[o]

# ids = np.genfromtxt("/home/toni/Dropbox/UofA/Research/MustaCHE/data/articles/articles_/ids", dtype=str, delimiter='\n') # Fix Performance

# print ids[o]

print 'Reachability: ', time.time() - start

start = time.time()

outF = open(hfile.replace(".hierarchy", ".lr"), "w")
np.savetxt(outF, o.reshape(1, o.shape[0]), delimiter=',', fmt='%d')
np.savetxt(outF, x.reshape(1, x.shape[0]), delimiter=',', fmt='%d')
np.savetxt(outF, reachability.reshape(1, reachability.shape[0]), delimiter=',', fmt='%1.5f')
outF.close()

print 'Store Values: ', time.time() - start
