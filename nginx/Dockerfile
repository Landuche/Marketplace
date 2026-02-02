FROM node:20-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

ARG VITE_API_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_GOOGLE_MAPS_KEY
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENV
ARG VITE_SENTRY_AUTH

COPY frontend/ .
RUN npm run build

FROM nginx:alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
