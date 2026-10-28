FROM dhi.io/alpine-base:3.23-alpine3.23-dev AS build
WORKDIR /app

#For vite bundler
ENV NODE_ENV=production
ENV HUSKY=0
ENV CI=true

RUN apk add --no-cache nodejs npm
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
CMD ["sh"]
