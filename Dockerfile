
FROM dockerfile/nodejs-bower-grunt

COPY package.json /data

RUN npm install

COPY bower.json /data

RUN bower install --allow-root

COPY . /data


