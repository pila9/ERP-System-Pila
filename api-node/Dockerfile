FROM node:22-alpine

WORKDIR /app

# Install OpenSSL for Prisma (OpenSSL 3 on Alpine 3.22, also provide compat if needed)
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
