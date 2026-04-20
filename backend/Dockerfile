# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# package.json oldin ko'chiriladi — Docker layer cache uchun
COPY package*.json ./

# Barcha dependency lar kerak (devDeps ham: @nestjs/cli, typescript)
RUN npm ci

# Source fayllarni ko'chirish
COPY . .

# NestJS production build — dist/ papkasini yaratadi
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Production environment
ENV NODE_ENV=production

COPY package*.json ./

# Faqat production dependency lar
RUN npm ci --omit=dev && npm cache clean --force

# Compiled kodni ko'chirish
COPY --from=builder /app/dist ./dist

# Uploads papkasi (fayllar upload uchun)
RUN mkdir -p ./uploads

# Railway o'zi PORT ni beradi (default 3000)
EXPOSE 3000

# start:prod = "node dist/main"
CMD ["node", "dist/main"]
