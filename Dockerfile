# Base image with Node.js
FROM node:18-slim 

# Create working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install 

# Copy application source code
COPY . . 

# Expose port (if needed)
EXPOSE 3100 


# Optional: Copy custom Redis configuration
# COPY redis.conf /usr/local/etc/redis/redis.conf


# Start the application
CMD ["npm", "start"] 