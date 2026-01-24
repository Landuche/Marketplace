FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install

ARG VITE_API_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_GOOGLE_MAPS_KEY

COPY . .
RUN npm run build

FROM alpine:latest
RUN mkdir -p /app/dist
COPY --from=build /app/dist /app/dist
RUN ls -la /app/dist

CMD ["cp", "-rv", "/app/dist/.", "/usr/share/nginx/html/"]