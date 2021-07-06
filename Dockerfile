FROM node:lts-alpine

# Working directory
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy source
COPY . .

# Build and cleanup
ENV NODE_ENV=production
RUN yarn run build

# Start server
CMD ["yarn", "start"]
