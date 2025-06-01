FROM python:3.11


RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install libgl1-mesa-glx -y



RUN mkdir -p /flask_chatgpt_app/

COPY local_chatgpt/requirements.txt /flask_chatgpt_app/requirements.txt

RUN pip install --upgrade pip
RUN pip3 install -r /flask_chatgpt_app/requirements.txt

COPY local_chatgpt/src/flask_chatgpt_app/ /flask_chatgpt_app/

WORKDIR /flask_chatgpt_app/

CMD [ "python", "run.py" ]



