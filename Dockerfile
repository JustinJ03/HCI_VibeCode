FROM nginx:alpine

# Cloud Run provides the PORT environment variable
ENV PORT=8080

# Copy the Nginx config as a template so env variables can be substituted by the Nginx entrypoint
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

EXPOSE 8080

# The default nginx entrypoint will run envsubst on the template and start nginx automatically
