FROM node:20 AS service-build
RUN apt-get update
RUN corepack enable
WORKDIR /app
ADD . .
RUN pnpm -F api... i --ignore-scripts
ENV NODE_ENV='production'
RUN rm -rf .env
RUN pnpm -F api build

FROM node:20 AS service
RUN corepack enable
WORKDIR /app
COPY --from=service-build /app/pnpm-workspace.yaml .
COPY --from=service-build /app/apps/api/dist .
COPY --from=service-build /app/apps/api/package.json ./
ENV NODE_ENV='production'
RUN pnpm i --prod --ignore-scripts

EXPOSE 3000
CMD ["node", "/app/src/main.js"]
