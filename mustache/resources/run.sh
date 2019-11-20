#!/bin/bash

FILE=$1 # Input file.
MPTS=$2 # Integer: mpts value.
MCLS=$3 # Integer: minimum cluster size.
FILT=$4 # RNG filter.
OUTP=$5 # Boolean:
DIST=$6 # Distance function
COMP=$7 # Boolean

OUTPUT_PATH=$8

mkdir -p $8

echo "File to be clustered: $1"
echo "mpts: $2"
echo "minClSize: $3"
echo "RNG filter: $4"
echo "Distance function: $6"
echo "Compact hierarchy: $7"

# Creates all the folder structure
cp $1 $8 # copies the dataset into the folder
mkdir -p "$8/msts" # creates the msts directory
mkdir -p "$8/visualization" # creates the visualization directory

FILE_NAME=$(basename "$1")

# Runs the pre-processing.
java -jar -Xmx12G IHDBSCAN.jar file=$8/$FILE_NAME minPts=$2 minClSize=$3 filter=$4 output=$5 dist_function=$6 compact=$7 separator=","

mv $8/visualization/*.mst $8/msts
# rm $8/visualization/*.tree

# Runs the meta-clustering.
python hierarchies.py "$8/visualization" $FILE_NAME 2 $MPTS

# Generates the visualization files.
for data in `ls ${8}/visualization/*RNG*.hierarchy | sort -V`;
do
    echo "Hierarchy File: ${data}"
    labels=${data//hierarchy/partition}
    # echo "Labels File: ${labels}"
    # python hierarchy.py ${data};
    python reachability-plot.py ${data} ${labels}
done

mv "$8/visualization/${FILE_NAME}_HAI_tree.out" $8
mv "$8/visualization/${FILE_NAME}_meta-hierarchy_.json" $8

python progress.py $8
