# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG REACT_APP_API_BASE_URL=http://localhost:8080
ARG REACT_APP_STRIPE_KEY=
ARG REACT_APP_CDN_URL=
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL \
    REACT_APP_STRIPE_KEY=$REACT_APP_STRIPE_KEY \
    REACT_APP_CDN_URL=$REACT_APP_CDN_URL
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
