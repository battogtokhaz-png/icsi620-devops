# ---------- Stage 1: test ----------
# Тест энд ажиллана. Унавал image огт үүсэхгүй.
FROM node:22-alpine AS test
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY test ./test
RUN node --test

# ---------- Stage 2: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
# Контейнерийн гаднаас хүрэхийн тулд 0.0.0.0 дээр сонсоно
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --chown=node:node package.json ./
# test stage-ээс хуулах нь BuildKit-ийг тестийг ЗААВАЛ ажиллуулахад хүргэнэ
COPY --chown=node:node --from=test /app/src ./src
# root биш хэрэглэгчээр ажиллана (least privilege)
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "src/server.js"]
