from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for
)


bp = Blueprint('dashboard', __name__)


@bp.route('/<task>', methods=['GET'])
def index(taskid):
    return render_template('dashboard/index.html')
