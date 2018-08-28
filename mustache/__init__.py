from flask import Flask, request, Config
from celery import Celery
import uuid
import datetime as dt

app = Flask(__name__)
app.config.from_json("settings.json")
app.config['SECRET_KEY'] = uuid.uuid4()


def format_datetime(value):
    return dt.datetime.fromtimestamp(float(value)).strftime('%m/%d/%Y').upper()


app.jinja_env.filters['datetime'] = format_datetime

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

from .views.dashboard import dashboard
from .views.home import home
from .views.api import api

app.register_blueprint(home, url_prefix="/")
app.register_blueprint(dashboard, url_prefix="/dashboard")
app.register_blueprint(api)

from .util.assests import assets
