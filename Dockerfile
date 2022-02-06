FROM node:lts-alpine

# Working directory
WORKDIR /app

# Install dependencies
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy source
COPY . .

# Build and cleanup
ENV NODE_ENV=production
RUN pnpm run build

# Install plugins(whitelist)
RUN cd dist && pnpm run plugin:install com.msgbyte.tasks

# Start server
CMD ["pnpm", "start:service"]
