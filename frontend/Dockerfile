# Static frontend (plain HTML/CSS/JS, no build step) served by nginx
FROM nginx:1.27-alpine

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy static site into nginx's web root
COPY . /usr/share/nginx/html

# Custom nginx config (multi-page app, no SPA rewrite needed)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
