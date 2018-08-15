from flask import Blueprint, render_template, url_for
from random_words import RandomWords
import random

# rw = RandomWords()

home = Blueprint('home', __name__)

@home.route('/')
def index():
    # names = []
    # for i in range(0,20):
    #     names.append({"name":rw.random_words(), "points":random.randint(20,10000), "val":random.randint(0,100)})
    return render_template("home/index.html")
