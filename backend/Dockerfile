# Use a specific Node.js alpine image
FROM node:20-alpine

# Upgrade OS packages to fix any High/Critical Trivy vulnerabilities
RUN apk update && apk upgrade --no-cache

# Set environment variable to production
ENV NODE_ENV=production

# Create the app directory and set ownership to the 'node' user before switching users
RUN mkdir -p /app && chown -R node:node /app

# Set working directory
WORKDIR /app

# Switch to the non-root 'node' user
USER node

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY --chown=node:node package*.json ./

# Use 'npm ci' for strict, reproducible builds based on package-lock.json
RUN npm ci --only=production

# Copy the remaining application code with correct ownership
COPY --chown=node:node . .

# Expose the application port
EXPOSE 3000

# Start the application using the exec form (array format) which handles OS signals properly
CMD ["node", "index.js"]
