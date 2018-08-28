from .. import celery
# from flask import current_app as app
import time

@celery.task(bind=True)
def process(self):
    print("started!")
    time.sleep(10)
    print("later!")
    return {"good!":True}