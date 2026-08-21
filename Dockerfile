FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

RUN mkdir -p /app/data

ENV PORT=3000
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/autonomo.db

VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "src/server.js"]
