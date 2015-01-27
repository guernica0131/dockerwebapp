#FROM node:0.10-onbuild
FROM dockerfile/nodejs-bower-grunt

COPY . /data

RUN npm install
# RUN npm install bower -g
RUN bower install --allow-root
# EXPOSE 1337

