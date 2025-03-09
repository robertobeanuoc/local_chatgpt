FROM python:3.11


RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install libgl1-mesa-glx -y



RUN mkdir -p /flask-chatgpt-app/

COPY local_chatgpt/requirements.txt /flask-chatgpt-app/requirements.txt

RUN pip install --upgrade pip
RUN pip3 install -r /flask-chatgpt-app/requirements.txt

COPY local_chatgpt/src/flask-chatgpt-app/ /flask-chatgpt-app/

WORKDIR /flask-chatgpt-app/

CMD [ "python", "run.py" ]



