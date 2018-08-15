from flask import Blueprint, render_template

dashboard = Blueprint('dashboard', __name__)

@dashboard.route('/')
def index():
    return render_template("dashboard/index2.html")
