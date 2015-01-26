FROM node:0.10-onbuild

ONBUILD RUN npm install
ONBUILD RUN npm install bower -g
ONBUILD RUN bower install
EXPOSE 1337

