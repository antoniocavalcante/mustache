FROM ubuntu:latest
USER root

RUN apt-get update && apt-get install -y \
    python3-dev \
    python3-pip \
    build-essential \
    python-dev \
    python-pip \
    nodejs \
    npm

RUN npm i -g nodemon

ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# dependancies
RUN apt-get update && apt-get install -y \
    default-jdk \
    python-tk \
    python3-tk \
    gunicorn \
    python-numpy

# copy source
COPY . /app
ENV HOME=/app
RUN chmod a+rwx app

WORKDIR /app
RUN mkdir -p workspace
RUN chmod a+rwx workspace

RUN pip3 install -r requirements.txt
RUN pip install -r mustache/resources/requirements.txt
RUN pip install hdbscan

WORKDIR /app/mustache/resources
RUN python setup.py build_ext --inplace

WORKDIR /app


# EXPOSE 5000

# ENTRYPOINT [ "gunicorn", "-b", "0.0.0.0:5000", "-w", "4", "wsgi:app" ]
