# MicroVM image for the standalone Colyseus server.
# Runs the TypeScript server directly with tsx (matches the dev setup).
#
# NOTE: Lambda MicroVM is ARM64-only. The image is built server-side by
# CreateMicrovmImage from this Dockerfile, so the host arch you run the deploy
# CLI from does not matter — but the base image must support arm64 (node:22
# Alpine does).
FROM public.ecr.aws/docker/library/node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["npx", "tsx", "src/entry.ts"]
