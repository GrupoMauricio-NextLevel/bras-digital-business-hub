# NextLevel Commerce Engine — imagem de produção (Railway, Fly.io, Render, VPS)
# Banco: PGlite em volume (/app/data) por padrão, ou DATABASE_URL=postgres://… externo.
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_PUBLIC_DEMO_MODE=false
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_PUBLIC_DEMO_MODE=false
ENV DATABASE_URL=pglite:///app/data/pg
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json /app/next.config.ts /app/drizzle.config.ts ./
RUN mkdir -p /app/data
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
