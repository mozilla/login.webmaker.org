FROM node:4.4
MAINTAINER Gideon Thomas <gideon@mozillafoundation.org>

WORKDIR /wmlogin
COPY package.json bower.json Gruntfile.js app.js /wmlogin/
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
EXPOSE 3000
CMD npm start
