# [cite_start]Use the official Node.js image. [cite: 2]
FROM node:18 AS api

# [cite_start]Set the working directory. [cite: 2]
WORKDIR /app

# [cite_start]Copy package files and install dependencies. [cite: 2]
COPY package*.json ./
RUN npm install

# [cite_start]Copy the rest of the API code. [cite: 2]
COPY . .

# Expose the API port.
EXPOSE 3001

# Command to run your API server.
CMD ["npm", "start"]