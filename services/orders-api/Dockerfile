FROM node:22.16.0-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY services/orders-api/src ./src

EXPOSE 3000

CMD ["node", "--watch", "--watch-preserve-output", "src/server.js"]
