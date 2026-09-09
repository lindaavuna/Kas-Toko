# ============================================================
# KasToko POS — Production Multi-Stage Dockerfile
# Basis: node:22-alpine (Ringan, Cepat, & Aman)
# ============================================================

# 1. Base image dengan libc6-compat untuk kompatibilitas Turbopack/Next.js
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 2. Instalasi dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# 3. Builder (Kompilasi TypeScript & Next.js Standalone)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Argument build opsional untuk embed APP_MODE
ARG NEXT_PUBLIC_APP_MODE=self-hosted
ARG NEXT_PUBLIC_APP_URL=http://localhost:9991
ENV NEXT_PUBLIC_APP_MODE=${NEXT_PUBLIC_APP_MODE}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN npm run build

# 4. Production Runner (Minimalis ~150MB)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=9991
ENV HOSTNAME="0.0.0.0"

# Jalankan container dengan pengguna non-root demi keamanan produksi
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Salin aset publik
COPY --from=builder /app/public ./public

# Salin output standalone Next.js beserta static chunks
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 9991

CMD ["node", "server.js"]
