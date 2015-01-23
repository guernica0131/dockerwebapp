FROM node:0.10-onbuild
# replace this with your application's default port
RUN npm install
EXPOSE 1337

