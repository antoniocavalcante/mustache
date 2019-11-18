from .. import celery
import json
import time
import os
import datetime as dt
from ..util.helpers import rngd
import subprocess


def createDatasetPath(workspace, directory):
    wp = os.path.join(workspace, directory)
    try:
        if not os.path.exists(wp):
            os.makedirs(wp)
            return wp
    except OSError:
        print('Error: Creating directory. ' + wp)
        return False


@celery.task(bind=True)
def process(self, workspace, root, files, settings):
    task_id = self.request.id.__str__()
    print("task {} queued!".format(task_id))
    settings['date_added'] = str(dt.datetime.now().timestamp())
    path = createDatasetPath(workspace, task_id)
    if path:
        for file in files:
            f = open(os.path.join(path, file['name']), 'wb')
            f.write(file['data'])
            f.close()
        with open(os.path.join(path, 'settings'), 'w') as fp:
            json.dump(settings, fp)

    root = str(os.path.dirname(root))
    venv = str(os.path.join(root, 'resources/run.sh'))
    sh = str(os.path.join(root, 'resources/run.sh'))
    in_file = str(os.path.join(path, files[0]['name']))

    while not os.path.exists(in_file):
        time.sleep(1)

    if os.path.isfile(in_file):

        mpts = str(settings['datasetMaxMpts'])
        minCluster = str(settings['datasetMinCluster'])
        rng = str(rngd[settings['datasetRng']])
        outp = True
        distance = str(settings['datasetDistance'])
        com = False

        subprocess.check_call([sh, in_file, mpts, minCluster,
                               rng, str(outp), distance, str(com), path], cwd=os.path.join(root, 'resources'))
    else:
        raise ValueError("%s isn't a file!" % in_file)

    print("completed!")

    return True
