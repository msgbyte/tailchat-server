FROM node:lts-alpine

# Working directory
WORKDIR /app

# Install dependencies
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Install plugins dependency
COPY ./pnpm-workspace.yaml ./
COPY ./plugins ./plugins
RUN pnpm install

# Copy source
COPY . .

# Build and cleanup
ENV NODE_ENV=production
RUN pnpm run build

# Install plugins(whitelist)
RUN pnpm run plugin:install com.msgbyte.tasks

# Copy public files
RUN mkdir -p ./dist/public && cp -r ./public/plugins ./dist/public && cp ./public/registry.json ./dist/public

# Start server
CMD ["pnpm", "start:service"]
