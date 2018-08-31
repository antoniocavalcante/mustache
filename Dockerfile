FROM ubuntu:latest
USER root
RUN apt-get update -y 
RUN apt-get install -y python3-dev python3-pip build-essential
RUN apt-get install -y python-dev python-pip


ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# dependancies 
RUN apt-get install -y default-jdk
RUN apt-get install -y python-tk
RUN apt-get install -y python3-tk 
RUN apt install -y gunicorn

# copy source
COPY . /app
ENV HOME=/app
WORKDIR /app
RUN mkdir workspace
RUN chmod a+rwx workspace


RUN pip3 install -r requirements.txt
RUN pip install -r mustache/resources/requirements.txt
RUN pip install hdbscan


# EXPOSE 5000

# ENTRYPOINT [ "gunicorn", "-b", "0.0.0.0:5000", "-w", "4", "wsgi:app" ]


