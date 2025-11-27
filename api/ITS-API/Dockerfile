# 1️⃣ Base image
FROM node:20-alpine

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package files
COPY package*.json ./

# 4️⃣ Install dependencies
RUN npm install --legacy-peer-deps

# 5️⃣ Copy the rest of the app
COPY . .

# 6️⃣ Install wait-for-it script to wait for Postgres
RUN apk add --no-cache bash curl

# 7️⃣ Copy wait-for-it script
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 8️⃣ Expose ports
EXPOSE 4038

# 9️⃣ Command to wait for Postgres then start backend
CMD ["/wait-for-it.sh", "postgres:5432", "--timeout=30", "--strict", "--", "npm", "run", "start"]
