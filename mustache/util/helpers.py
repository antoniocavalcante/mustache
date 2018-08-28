import os
from flask import current_app as app

def createDatasetPath(directory):
    wp = os.path.join(app.config['WORKSPACE'], directory)
    try:
        if not os.path.exists(wp):
            os.makedirs(wp)
    except OSError:
        print ('Error: Creating directory. ' +  wp)