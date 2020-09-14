from __future__ import division
import os

import numpy as np
import re
import hutil

import json

import sys

import math

class ClusterTree:
    class ClusterNode:
        def __init__(self, id, birth, death, stability, parent):
            self.id = int(id)
            if birth != 'NaN':
                self.birth = float(birth)
            else:
                self.birth = float(death) * 1.1
            self.death = float(death)
            if stability != 'NaN':
                self.stability = float(stability)
            else:
                self.stability = 0.0
            self.parent = parent
            self.children = []
            self.childrenT = []
            self.persistence = 0
            self.points = []


        def __str__(self):
            result = "id: " + str(self.id) + '\n'
            result += "birth: " + str(self.birth) + ", death: " + str(self.death) + '\n'
            result += "parent: " + (str(self.parent.id) if self.parent != None else "None") + '\n'
            result += "children: " + str(self.children) + '\n'
            result += "stability: " + str(self.stability) + '\n'
            result += "persistence: " + str(self.persistence) + '\n'
            result += "#points: " + str(self.points[1] - self.points[0] + 1) + '\n'

            return result


        def isLeaf(self):
            """Short summary.

            Parameters
            ----------


            Returns
            -------
            type
                Description of returned object.

            """
            return len(self.children) == 0


    class ClusterNodeEncoder(json.JSONEncoder):

        def default(self, obj):
            if isinstance(obj, ClusterTree.ClusterNode):
                return dict(id=obj.id,
                            n=obj.points[0][3]-obj.points[0][2]+1,
                            stability=obj.stability,
                            birth=obj.birth,
                            death=obj.death,
                            points=obj.points,
                            children=obj.children)

            if isinstance(obj, ClusterTree):
                return obj.__dict__

            if isinstance(obj, np.ndarray):
                return obj.tolist()

            return json.JSONEncoder.default(self, obj)


    def __init__(self, dataset, mpts):
        self.n = 0
        self.tree = {}
        self.order = []
        self.hfile = hutil.hierarchy_path(dataset, mpts)
        self.dataset = dataset
        self.build(hutil.tree_path(dataset, mpts))


    def store_json(self, mpts):

        tree_directory = os.path.dirname(self.dataset) + "/trees/"

        with open(tree_directory + os.path.basename(self.dataset) + "-ct-" + str(mpts) + ".json" , "w") as write_file:
            json.dump(self.tree.get(1)[0],
                      write_file,
                      cls = ClusterTree.ClusterNodeEncoder,
                      separators=(',', ':'))


    def to_json(self):

        obj_dict = {
            "__class__": self.__class__.__name__,
            "__module__": self.__module__
        }

        obj_dict.update(self.__dict__)

        return obj_dict


    def build(self, file):
        """Short summary.

        Parameters
        ----------
        file : type
            Description of parameter `file`.

        Returns
        -------
        type
            Description of returned object.

        """

        self.tree[0] = [None]

        with open(file, "r") as f:
            for line in f:
                # Reads line from the cluster tree file.
                l = line.replace("\n", "").split(",")

                node = self.ClusterNode(l[0], l[1], l[2], l[3],
                                        self.tree[int(l[-1])][-1])

                # Adds node to the tree.
                self.tree[int(l[0])] = [node]

                # Updates the number of nodes added to the tree.
                self.n += 1

                # Updates parent's children.
                if int(l[-1]) != 0:
                    self.tree[int(l[-1])][-1].children.append(node)

        # Read the order of the points from the hierarchy file.
        with open(self.hfile) as f:
            self.order = np.fromstring(f.readline(), dtype=int, sep=',')

            # Initializes previous level.
            previous_level = self.tree[1][0].birth

            for line in f:
                tmp = re.split(r'[,]*', line.strip())
                level = float(tmp[0])
                # Checks if that level is compatible with the current cluster node.
                tmp = map(int, re.split(r'[-,:]*', ",".join(tmp[1:])))
                # Add all levels of the cluster.
                for i in range(0, len(tmp), 3):
                    if self.tree[tmp[i]][0].points:
                        if self.tree[tmp[i]][0].points[-1][-1] != tmp[i + 2] or \
                        self.tree[tmp[i]][0].points[-1][-2] != tmp[i + 1]:
                            self.tree[tmp[i]][0].points.append([previous_level, level, tmp[i + 1], tmp[i + 2]])
                        else:
                            self.tree[tmp[i]][0].points[-1][1] = level
                    else:
                        self.tree[tmp[i]][0].points.append([previous_level, level, tmp[i + 1], tmp[i + 2]])

                previous_level = level

        return self


    def get(self, n):
        """Gets the cluster(s) node(s) corresponding to id `n`.

        Parameters
        ----------
        n : int

        Returns
        -------
        ClusterNode
            Node corresponding to id `n`.

        """
        return self.tree.get(n)[0]


    def split(self, cluster, birth, death):

        # Create new cluster fragment, with same ID.
        fragment = self.ClusterNode(cluster.id, birth,
                                    max(death, cluster.death), 0, cluster)

        # Add the new fragment to the tree.
        self.tree[cluster.id].append(fragment)

        # Update the children of the new cluster.
        fragment.children = cluster.children

        # Update birth and death levels of parent.
        cluster.death = birth

        # Update cluster children to contain just the new fragment.
        cluster.children = [fragment]

        # Retrieve the points related to this new fragment.
        cluster.points = self.retrieve_points(fragment)

        return 0


    def retrieve_points(self, cluster, level = None):

        if level is None:
            level = cluster.birth

        with open(self.hfile) as f:
            # Read the order of the points, no need to store.
            f.readline()

            # Starts reading the hierarchy file from the third line.
            for current_line in f:
                tmp = re.split(r'[,]*', current_line.strip())
                current_level = float(tmp[0])

                # Checks if that level is compatible with the current cluster node.
                if current_level < level:
                    tmp = re.split(r'[,]*', current_line.strip())
                    tmp = map(int, re.split(r'[-,:]*', ",".join(tmp[1:])))

                    for i in range(0, len(tmp), 3):
                        if int(tmp[i]) == cluster.id:
                            return (int(tmp[i + 1]), int(tmp[i + 2]))
                    # If after inspecting that level no cluster is found
                    return None
                else:
                    continue

        return None


    def root(self):
        """Gets the tree's root node`.

        Parameters
        ----------


        Returns
        -------
        ClusterNode
            Root node.

        """
        return self.tree.get(1)[0]


    def parent(self, c):
        """Short summary.

        Parameters
        ----------
        c : type
            Description of parameter `c`.

        Returns
        -------
        type
            Description of returned object.

        """
        return self.tree.get(c).parent


    def points(self, cluster, level=None):
        """Short summary.

        Parameters
        ----------
        c : type
            Description of parameter `c`.

        Returns
        -------
        type
            Description of returned object.

        """

        if level is not None:
            points = self.retrieve_points(cluster, level)
            if points is None:
                return None
            return self.order[points[0]:points[1] + 1]

        return self.order[cluster.points[0][2]:cluster.points[0][3] + 1]


    # def _points(self, c, mpts, level):
    #     return []


    def size(self, c):
        """Short summary.

        Parameters
        ----------
        c : type
            Description of parameter `c`.

        Returns
        -------
        type
            Description of returned object.

        """
        cluster = self.tree.get(c)
        return cluster.points[1] - cluster.points[0] + 1


    def update(self, c, s):
        """Short summary.

        Parameters
        ----------
        c : type
            Description of parameter `c`.
        s : type
            Description of parameter `s`.

        Returns
        -------
        type
            Description of returned object.

        """
        self.tree.get(c).persistence += s


    def average(self, m):
        """Short summary.

        Parameters
        ----------
        m : type
            Description of parameter `m`.

        Returns
        -------
        type
            Description of returned object.

        """
        for c in self.tree.keys():
            self.tree.get(c).persistence /= (m - 1)


    def get_level(self, l):
        """Short summary.

        Parameters
        ----------
        l : type
            Description of parameter `l`.

        Returns
        -------
        type
            Description of returned object.

        """
        result = []

        for id, node in self.tree.items():
            if l >= node.death and l <= node.birth:
                result.append(id)

        return result


    def stability(self, criterion, c):
        """Short summary.

        Parameters
        ----------
        c : type
            Description of parameter `c`.

        Returns
        -------
        type
            Description of returned object.

        """
        # return self.tree.get(c).stability
        return criterion[c]


    def stability_children(self, criterion, c):
        """Short summary.

        Parameters
        ----------
        c : type
            Description of parameter `c`.

        Returns
        -------
        type
            Description of returned object.

        """
        # return sum([criterion[c] for child in self.tree.get(c).children])
        return sum([criterion[c] for child in self.tree.get(c).children])


    def propagate(self):
        """Short summary.

        Parameters
        ----------


        Returns
        -------
        type
            Description of returned object.

        """

        return 0


    def confidence(self, cluster):
        """Short summary.

        Parameters
        ----------
        cluster : type
            Description of parameter `cluster`.

        Returns
        -------
        type
            Description of returned object.

        """
        if self.get(cluster).isLeaf():
            return 0

        compare = 0

        for child in self.get(cluster).children:
            compare = max(compare, self.get(child).death)

        return (self.get(cluster).death - compare) / self.get(cluster).death


    def confidence_sum(self):
        """Short summary.

        Parameters
        ----------


        Returns
        -------
        type
            Description of returned object.

        """
        result = 0

        for cluster in self.tree:
            result += self.confidence(cluster)

        return result


    def confidences(self):
        """Short summary.

        Parameters
        ----------


        Returns
        -------
        type
            Description of returned object.

        """
        result = []

        for cluster in self.tree:
            c = self.confidence(cluster)
            if c > 0:
                result.append(c)

        return result


    def splits(self):
        """Short summary.

        Parameters
        ----------


        Returns
        -------
        type
            Description of returned object.

        """
        result = 0

        for cluster in self.tree:
            if not self.get(cluster).isLeaf():
                result += 1

        return result


    def index(self):
        """Short summary.

        Parameters
        ----------


        Returns
        -------
        type
            Description of returned object.

        """
        return sum(self.confidences()) / self.splits()


    def extract(self, criterion):
        """Short summary.

        Parameters
        ----------


        Returns
        -------
        type
            Description of returned object.

        """
        # List to keep the cumulative scores.
        cumulative = np.zeros(len(self.tree))

        # Partitioning
        p = np.ones(len(self.tree))

        # Root node cannot be selected
        p[0] = 0

        # Find the nodes that have leaf children.
        nodes = []

        for c, v in self.tree.items():
            if v.isLeaf() and v.parent not in nodes:
                nodes.append(v.parent)
        for c, v in self.tree.items():
            if (not v.isLeaf()) and v.parent in nodes:
                nodes.remove(v.parent)

        while nodes:
            current = nodes.pop(0)

            if self.stability(criterion, current) < self.stability_children(criterion, current):
                cumulative[current] = self.stability_children(criterion, current)
                p[current - 1] = 0
            else:
                cumulative[current] = self.stability(criterion, current)
                # Set p = 0 for every cluster in current's subtrees.
                children = list(self.tree.get(current).children)

                while children:
                    child = children.pop(0)
                    p[child - 1] = 0
                    children.extend(self.tree.get(child).children)

            if self.parent(current) not in nodes and self.parent(current) != 1:
                nodes.append(self.parent(current))

        labels = np.zeros(len(self.order))

        for i in range(len(p)):
            if p[i] == 1:
                cluster = self.tree.get(i + 1)
                labels[cluster.points[0]:cluster.points[1] + 1] = i + 1

        result = np.zeros(len(labels))

        # Sort and return array to reflect the original order of the points.
        for i in range(len(result)):
            result[self.order[i]] = labels[i]

        print np.unique(result)

        return result

if __name__ == '__main__':

    sys.setrecursionlimit(100000)

    for mpts in range(2, int(sys.argv[2])):
        clusterTree = ClusterTree(sys.argv[1], mpts)
        clusterTree.store_json(mpts)
