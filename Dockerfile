FROM node:20-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy local code to the container image
COPY . ./

# Use the PORT environment variable in Cloud Run
ENV PORT=3000

# Run the web service on container startup
CMD [ "npm", "start" ]
