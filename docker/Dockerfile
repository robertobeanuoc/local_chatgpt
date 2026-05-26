FROM python:3.13


RUN apt-get update -y
RUN apt-get upgrade -y



RUN mkdir -p /flask_chatgpt_app/

# Copy requirements from repository root
COPY requirements.txt /flask_chatgpt_app/requirements.txt

RUN pip install --upgrade pip
RUN pip3 install -r /flask_chatgpt_app/requirements.txt

# Copy the Flask app source into the image
COPY src/flask_chatgpt_app/ /flask_chatgpt_app/

WORKDIR /flask_chatgpt_app/

CMD [ "python", "run.py" ]



