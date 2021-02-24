FROM node:12.19

WORKDIR /usr/src/app

ENV NODE_ENV="production"
ENV TOKEN=
ENV DBCLUSTER=
ENV DBUSER=
ENV DBPASS=

COPY package.json ./

RUN npm install

COPY . .

CMD [ "npm", "run", "start" ]
