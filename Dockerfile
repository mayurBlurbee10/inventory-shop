# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app
RUN apk add --no-cache openssl
# Copy the package.json and package-lock.json (or yarn.lock) into the container
COPY package.json yarn.lock* package-lock.json* .npmrc* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install --legacy-peer-deps --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

#Rebuild the source code only when needed
WORKDIR /app

# Copy the rest of your application files into the container
COPY . .

# Build the Next.js application
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Expose the port the app will run on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
