# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Bu yerda dist/ papkasi yaratiladi
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# Faqat ishlab chiqarish uchun kerakli modullarni o'rnatish
RUN npm ci --only=production && npm cache clean --force

# MUHIM: Builder bosqichidan faqat kerakli fayllarni ko'chiramiz
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Ilova ishga tushishi uchun kerakli port va buyruq
EXPOSE 3000
CMD ["node", "dist/main"]