FROM mcr.microsoft.com/playwright:v1.63.0-noble

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# The invoice runtime needs Chromium screenshots and downloads, not system video codecs.
RUN apt-get purge -y libavcodec60 libavformat60 libavfilter9 libavutil58 \
    libswresample4 libswscale7 libpostproc57 libcjson1 \
    libmbedcrypto7t64 libzvbi0t64 libopenexr-3-1-30 \
    gstreamer1.0-plugins-bad libgstreamer-plugins-bad1.0-0

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
COPY server ./server
RUN npm run build
RUN npm prune --omit=dev
RUN apt-get purge -y libzvbi-common libsrt1.5-gnutls

RUN mkdir -p /app/.data && chown -R pwuser:pwuser /app
USER pwuser

ENV NODE_ENV=production \
    PORT=3001 \
    ONCE_HOST=0.0.0.0 \
    ONCE_PUBLIC_DEMO=1 \
    ONCE_WEB_ORIGIN=http://127.0.0.1:3001

EXPOSE 3001
CMD ["node", "--import", "tsx", "server/index.ts"]
