FROM node:lts-alpine

# Working directory
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy source
COPY . .

# Build and cleanup
ENV NODE_ENV=production
RUN pnpm run build

# Start server
CMD ["pnpm", "start:service"]
