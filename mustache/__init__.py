import datetime as dt
import uuid

from celery import Celery
from flask import Config, Flask, request

from .util.assests import assets
from .views.api import api
from .views.dashboard import dashboard
from .views.home import home

app = Flask(__name__)
app.config.from_json("settings.json")
app.config['SECRET_KEY'] = uuid.uuid4()


def format_datetime(value):
    return dt.datetime.fromtimestamp(float(value)).strftime('%m/%d/%Y').upper()


app.jinja_env.filters['datetime'] = format_datetime

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)


app.register_blueprint(home, url_prefix="/")
app.register_blueprint(dashboard, url_prefix="/dashboard")
app.register_blueprint(api)
