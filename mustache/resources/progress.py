import json

import os
import sys

basedir = sys.argv[1]

with open(basedir + "/progress.json", "r") as jsonFile:
    data = json.load(jsonFile)

data["state"]["current"] = 1

with open(basedir + "/progress.json", "w") as jsonFile:
    json.dump(data, jsonFile)
