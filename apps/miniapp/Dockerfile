FROM node:20 AS service-build
RUN apt-get update
# волшебный флажок который фиксит corepack enable => https://github.com/pnpm/pnpm/issues/9029
ARG COREPACK_INTEGRITY_KEYS=0
RUN corepack enable
WORKDIR /app
ADD . .
RUN pnpm -F miniapp... -F miniapp i --ignore-scripts
ENV NODE_ENV=production
ARG VITE_API_URL=''
RUN pnpm -F miniapp build

FROM nginx AS service
COPY apps/miniapp/nginx/nginx.conf /etc/nginx/nginx.conf
COPY apps/miniapp/nginx/default.conf /etc/nginx/conf.d/
COPY --from=service-build /app/apps/miniapp/dist /var/www/html/web
