FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS proddeps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/giftlist.db"
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# NextAuth behind an arbitrary host; pass AUTH_SECRET at runtime.
ENV AUTH_TRUST_HOST=true

COPY --from=builder /app/.next/standalone ./
# Full production node_modules (instead of the traced subset) so the Prisma
# CLI can run "migrate deploy" at container start.
RUN rm -rf node_modules
COPY --from=proddeps /app/node_modules ./node_modules
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && mkdir -p /data

VOLUME /data
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
