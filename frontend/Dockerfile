# Stage 1 - Build
FROM node:20-alpine AS builder

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

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
