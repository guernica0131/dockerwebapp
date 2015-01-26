FROM node:0.10-onbuild

ONBUILD RUN npm install
ONBUILD RUN npm install bower -g
ONBUILD RUN bower install
EXPOSE 1337

# Pull base image.
# FROM dockerfile/nodejs-bower-grunt

# Set instructions on build.
# ONBUILD ADD package.json /app/
# ONBUILD RUN npm install
# ONBUILD ADD bower.json /app/
# ONBUILD RUN bower install --allow-root
# ONBUILD ADD . /app
# ONBUILD RUN grunt build

# Define working directory.
# WORKDIR /app

# Define default command.
# CMD ["npm", "start"]

# Expose ports.
# EXPOSE 1337