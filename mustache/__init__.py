from flask import Flask, request, Config
from .views.dashboard import dashboard
from .views.home import home
from .views.api import api

app = Flask(__name__)
app.config.from_json("settings.json")

app.register_blueprint(home, url_prefix="/")
app.register_blueprint(dashboard, url_prefix="/dashboard")
app.register_blueprint(api)

from .util.assests import assets

