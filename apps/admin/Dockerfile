FROM node:20 AS service-build
RUN apt-get update
RUN corepack enable
WORKDIR /app
ADD . .
RUN pnpm -F admin... -F integrator i --ignore-scripts
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL=''
RUN pnpm -F admin build

FROM node:20 AS service-deps
RUN corepack enable
WORKDIR /app
ADD . .
ARG NODE_ENV=production
RUN pnpm -F admin i --prod --ignore-scripts

FROM node:20 AS service
RUN corepack enable
WORKDIR /app
COPY --from=service-deps /app/node_modules ./node_modules
COPY --from=service-build /app/apps/admin/.next/standalone .
COPY --from=service-build /app/apps/admin/.next/static /app/apps/admin/.next/static
COPY --from=service-build /app/apps/admin/public /app/apps/admin/public
ENV NODE_ENV='production'

EXPOSE 3000
CMD ["node", "/app/apps/admin/server.js"]
