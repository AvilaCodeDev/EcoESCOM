FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json          ./apps/api/
COPY packages/db/package.json       ./packages/db/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile

# ---- build (generate Prisma client) ----
FROM deps AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN pnpm --filter @repo/db db:generate

# ---- runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g tsx

COPY --from=builder /app/node_modules          ./node_modules
COPY --from=builder /app/packages              ./packages
COPY --from=builder /app/apps/api              ./apps/api
COPY package.json pnpm-workspace.yaml ./

EXPOSE 4000
CMD ["tsx", "apps/api/src/server.ts"]

FROM runner AS development
