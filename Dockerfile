FROM node:16.17.1-alpine3.15

RUN apk add --no-cache \
  chromium \
  chromium-chromedriver

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]