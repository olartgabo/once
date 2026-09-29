FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
COPY server ./server
RUN npm run build

RUN mkdir -p /app/.data && chown -R pwuser:pwuser /app
USER pwuser

ENV NODE_ENV=production \
    PORT=3001 \
    ONCE_HOST=0.0.0.0 \
    ONCE_PUBLIC_DEMO=1 \
    ONCE_WEB_ORIGIN=http://127.0.0.1:3001

EXPOSE 3001
CMD ["node", "--import", "tsx", "server/index.ts"]
