FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source files
COPY . .

# Expose backend port
EXPOSE 3001

# Start the server
CMD ["npx", "tsx", "server.ts"]
