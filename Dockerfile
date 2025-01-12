# Use a lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire application
COPY . .

# Build the Nuxt application
RUN npm run build

# Expose the Nuxt port (default is 3000)
EXPOSE 3000

# Start the Nuxt application in production mode
CMD ["npm", "run", "preview"]
