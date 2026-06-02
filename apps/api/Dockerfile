FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

COPY packages/shared/src packages/shared/src
COPY apps/api/src apps/api/src
COPY apps/api/.env.example apps/api/.env.example

# 跳过根目录 prepare（vite-plus 在容器内无 native binding）
RUN pnpm install --frozen-lockfile --filter @mt-dev/api... --ignore-scripts

ENV NODE_ENV=production
ENV PORT=6333

EXPOSE 6333

CMD ["node", "--experimental-strip-types", "apps/api/src/index.ts"]
