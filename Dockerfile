#FROM node:0.10-onbuild
# replace this with your application's default port
#RUN npm install
#EXPOSE 1337

# Pull base image.
FROM dockerfile/nodejs-bower-grunt

# Set instructions on build.
ONBUILD ADD package.json .
ONBUILD RUN npm install
ONBUILD ADD bower.json .
ONBUILD RUN bower install --allow-root

# Define working directory.
# WORKDIR /app

# Define default command.
CMD ["npm", "start"]

# Expose ports.
EXPOSE 1337