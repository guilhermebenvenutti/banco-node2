FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY . .

EXPOSE 3001

CMD ["serve", "Front", "-l", "3001"]
