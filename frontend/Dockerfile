# [cite_start]Use the official Node.js image. [cite: 3]
FROM node:18 AS frontend

# [cite_start]Set the working directory. [cite: 3]
WORKDIR /app

# [cite_start]Copy package files and install dependencies. [cite: 3]
COPY package*.json ./
RUN npm install

# [cite_start]Copy the rest of the frontend code. [cite: 3]
COPY . .

# Expose the frontend port.
EXPOSE 3000

# Command to run your frontend server.
CMD ["npm", "start"]