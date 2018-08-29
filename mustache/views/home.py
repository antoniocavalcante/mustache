from flask import Blueprint, render_template, url_for, current_app as app
from collections import OrderedDict
import os
import operator
import json
import glob

home = Blueprint('home', __name__)


def get_datasets():
    root = app.config['WORKSPACE']
    datasets = {}

    dirlist = [item for item in os.listdir(
        root) if os.path.isdir(os.path.join(root, item))]

    for dir in dirlist:

        file = glob.glob(os.path.join(
            os.path.join(root, dir), "settings"))[0]

        with open(file) as f:
            data = json.load(f)

        datasets[dir] = data

    return OrderedDict(sorted(datasets.items(), key=lambda x: float(x[1]['date_added']), reverse=True))


@home.route('/')
def index():
    if app.config['WORKSPACE']:
        datasets = get_datasets()
    else:
        datasets = {}
    return render_template("home/index.html", datasets=datasets)
