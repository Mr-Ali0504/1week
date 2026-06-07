# Stage 1 - Build
FROM node:20-alpine AS builder

# Upgrade OS packages to fix any High/Critical Trivy vulnerabilities
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Use npm ci instead of npm install for reproducible, faster builds
RUN npm ci

# Copy remaining source code
COPY . .

# Build the application
RUN npm run build

# Stage 2 - Serve
FROM nginx:alpine

# Upgrade OS packages to fix any High/Critical Trivy vulnerabilities
RUN apk update && apk upgrade --no-cache

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
