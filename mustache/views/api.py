from flask import Blueprint, request, jsonify, current_app as app, Response, redirect
import json, hdbscan, tkinter as tk, os
from tkinter import filedialog
from .. import __file__ as base

api = Blueprint('api', __name__)

@api.route('/workspace', methods=['GET', 'POST'])
def workspace():
    if request.method == "GET":
        workspace = app.config['WORKSPACE']
        if not workspace:
            return Response('{"path":'+'"'+str(workspace)+'"'+'}', status=404, mimetype='application/json')
        else:
            return Response('{"path":'+'"'+str(workspace)+'"'+'}', status=200, mimetype='application/json')
    if request.method == "POST":
        path = request.json['path']
        app.config['WORKSPACE'] = path

        with open(os.path.join(os.path.dirname(base),'settings.json')) as jfile:
            data = json.load(jfile)
            data['WORKSPACE'] = path

        with open(os.path.join(os.path.dirname(base),'settings.json'), 'w') as jfile:
            json.dump(data, jfile)

        return Response("{}", status=200, mimetype='application/json')
        

@api.route("/directory")
def directory():
    root = tk.Tk()
    root.attributes("-topmost", True)
    root.withdraw()
    dirStr = filedialog.askdirectory()
    root.destroy()

    if(dirStr == "" or dirStr is None):
        return Response(status=404)
    else:
        return dirStr


@api.route('/distance')
def index():
    return str(hdbscan.dist_metrics.METRIC_MAPPING)


@api.route("/submit", methods=['GET', 'POST'])
def submit():
    if request.method == 'POST':
        result = request.form
        files = request.files
        for k,v in files.items():
            print(files['file-dataset'])

    return jsonify(status="good!")
