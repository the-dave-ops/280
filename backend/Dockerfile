FROM node:18-slim

# Install OpenSSL and CA certificates for Prisma
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client with SSL verification disabled for binaries download
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

# Copy rest of source code
COPY . .

# Copy and set permissions for migration script
COPY scripts/run-migrations.sh /app/scripts/
RUN chmod +x /app/scripts/run-migrations.sh

# Expose port
EXPOSE 3001

# Run migrations and start the application
CMD ["/app/scripts/run-migrations.sh", "npm", "run", "dev"]

