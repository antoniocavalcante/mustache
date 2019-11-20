from flask import Blueprint, request, jsonify, current_app as app, Response, redirect, url_for, send_file, send_from_directory
import json
import shutil
import time
import datetime as dt
# import hdbscan
import tkinter as tk
import os
import zipfile
from io import BytesIO
from tkinter import filedialog
from .. import __file__ as base
from ..tasks.tasks import process
from ..util.helpers import rngl

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

        with open(os.path.join(os.path.dirname(base), 'settings.json')) as jfile:
            data = json.load(jfile)
            data['WORKSPACE'] = path

        with open(os.path.join(os.path.dirname(base), 'settings.json'), 'w') as jfile:
            json.dump(data, jfile)

        return Response("{}", status=200, mimetype='application/json')


@api.route("/directory")
def directory():
    root = tk.Tk()
    # root.iconbitmap(os.path.join(
    #     os.path.dirname(base), 'static/icon/favicon.ico'))
    root.attributes("-topmost", True)
    root.withdraw()
    dirStr = filedialog.askdirectory()
    root.destroy()

    if(dirStr == "" or dirStr is None):
        return Response(status=404)
    else:
        return dirStr


@api.route('/distance')
def distance():
    return jsonify(["euclidean", "angular", "pearson", "manhattan", "supremum"])


@api.route('/rng')
def rng():
    return jsonify(rngl)


@api.route("/submit", methods=['GET', 'POST'])
def submit():
    if request.method == 'POST':
        result = request.form.to_dict()
        files = request.files
        data = []

        try:
            data.append({"name": files['file-dataset'].filename,
                         "data": files['file-dataset'].read()})
        except Exception as e:
            print("Error loading data file:", e)

        try:
            data.append({"name": files['file-labels'].filename,
                         "data": files['file-labels'].read()})

            result['labels-file'] = files['file-labels'].filename

        except Exception as e:
            print("Error loading labels file:", e)

        process.apply_async(
            args=[app.config['WORKSPACE'], base, data, result])

        time.sleep(1)

    return jsonify(status="good!")


@api.route("/status/<id>", methods=['GET', 'POST'])
def status(id):
    fn = os.path.join(
        os.path.join(app.config['WORKSPACE'], id), "progress.json")

    with open(fn) as f:
        data = json.load(f)

    return jsonify(data)


@api.route("/delete/<id>", methods=['GET', 'POST'])
def delete(id):
    print("deleted id!", id)
    root = app.config['WORKSPACE']
    if os.path.exists(os.path.join(root, id)):
        try:
            shutil.rmtree(os.path.join(root, id))
            return Response("{}", status=200, mimetype='application/json')
        except OSError as e:
            print("Error:")
            return Response("{}", status=404, mimetype='application/json')
    else:
        print("Sorry, I can not find %s file.")
    return Response("{}", status=404, mimetype='application/json')


@api.route("/exportZip", methods=['GET', 'POST'])
def export_zip():
    memory_file = BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zf:
        files = [None]
        for individualFile in files:
            data = zipfile.ZipInfo(individualFile['fileName'])
            data.date_time = time.localtime(time.time())[:6]
            data.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(data, individualFile['fileData'])
    memory_file.seek(0)
    return send_file(memory_file, attachment_filename='capsule.zip', as_attachment=True)


@api.route("/importtZip", methods=['GET', 'POST'])
def import_zip():
    memory_file = BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zf:
        files = [None]
        for individualFile in files:
            data = zipfile.ZipInfo(individualFile['fileName'])
            data.date_time = time.localtime(time.time())[:6]
            data.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(data, individualFile['fileData'])
    memory_file.seek(0)
    return send_file(memory_file, attachment_filename='capsule.zip', as_attachment=True)
