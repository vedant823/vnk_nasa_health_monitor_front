# ---- Build stage ------------------------------------------------------------
# All build/dev dependencies (Node, TypeScript, Vite) live only in this stage.
FROM node:22-alpine AS build

WORKDIR /app

# Vite env vars are baked into the bundle at build time.
# Override with:  docker build --build-arg VITE_API_URL=http://myhost:8080 .
ARG VITE_API_URL=http://localhost:8080
ARG VITE_USE_MOCKS=false
ENV VITE_API_URL=$VITE_API_URL \
    VITE_USE_MOCKS=$VITE_USE_MOCKS

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build (type-check + vite build -> dist/).
COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---- Serve stage ------------------------------------------------------------
FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
