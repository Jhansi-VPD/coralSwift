FROM node:20-alpine AS base

WORKDIR /srv

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
COPY --from=builder /srv/.next ./.next
COPY package*.json ./
RUN npm ci --omit=dev
COPY .env .env.local 2>/dev/null || true
EXPOSE 3000
CMD ["npx", "next", "start"]