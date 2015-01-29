
FROM dockerfile/nodejs-bower-grunt

ADD package.json /data/package.json

RUN npm install

ADD bower.json /data/bower.json

RUN bower install --allow-root

ADD . /data


