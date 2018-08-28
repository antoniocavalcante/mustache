from .. import celery
import json
import time
import os
import datetime as dt
from ..util.helpers import rngd


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
def process(self, workspace, files, settings):
    task_id = self.request.id.__str__()
    print("task {} queued!".format(task_id))
    settings['date_added'] = str(dt.datetime.now().timestamp())
    path = createDatasetPath(workspace, task_id)
    if path:
        for file in files:
            f = open(os.path.join(path, file['name']), 'w')
            f.write(file['data'])
            f.close()
        with open(os.path.join(path, 'settings'), 'w') as fp:
            json.dump(settings, fp)
    print("completed!")

    # file.save(wp)
    # file2.save()
    # for i in range(0, 10):
    #     f = open("guru"+i+".txt", "w+")
    #     f.write("This is line %d\r\n" % (i+1))
    #     f.close
    #     time.sleep(1)

    return True
