# MicroVM image for the standalone Colyseus server.
# Runs the TypeScript server directly with tsx (matches the dev setup).
#
# NOTE: Lambda MicroVMs is ARM64-only. The image is built server-side by
# CreateMicrovmImage from this Dockerfile, so the host arch you run the deploy
# CLI from does not matter — but the base image must support arm64 (node:22
# Alpine does). The digest below is the multi-arch manifest list, so it still
# resolves to the arm64 variant at build time.
FROM public.ecr.aws/docker/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV PORT=8080
EXPOSE 8080

# Drop root: run as the unprivileged `node` user that ships with the base image.
# /app is owned by root after the copies above; hand it to `node` so npm/tsx can
# read it, then switch users.
RUN chown -R node:node /app
USER node

# Liveness probe against the server's built-in /health endpoint (server/src/index.ts).
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||8080,path:'/health'},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["npx", "tsx", "src/entry.ts"]
