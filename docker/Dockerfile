FROM python:3.11


RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install libgl1-mesa-glx -y



RUN mkdir -p /app/

RUN pip install --upgrade pip
RUN pip3 install -r requirements.txt

COPY src app/


CMD [ "python", "app/run.py" ]



