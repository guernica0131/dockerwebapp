FROM node:0.10-onbuild

RUN npm install
RUN npm install bower -g
RUN bower install
EXPOSE 1337

