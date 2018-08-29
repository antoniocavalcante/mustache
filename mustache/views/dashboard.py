from flask import Blueprint, render_template, current_app as app, send_from_directory
import os
import json

dashboard = Blueprint('dashboard', __name__)


@dashboard.route('/<id>')
def index(id):
    fn = os.path.join(
        os.path.join(app.config['WORKSPACE'], id), "settings")
    with open(fn) as f:
        data = json.load(f)
    name = data['datasetName'].lower()
    return render_template("dashboard/index.html", id=id, name=name)


@dashboard.route('/<dataset>/<path:filename>')
def custom_static(filename, dataset):
    return send_from_directory(os.path.join(app.config['WORKSPACE'], dataset), filename)
