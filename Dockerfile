# Use the official Node.js image as the base image
FROM node:18-alpine

# Set environment variables for Box SDK (for example purposes)
ARG BOX_CLIENT_ID
ARG BOX_CLIENT_SECRET
ARG BOX_ENTERPRISE_ID
ARG BOX_PRIVATE_KEY
ARG BOX_PRIVATE_KEY_PASSWORD
ARG BOX_PUBLIC_KEY_ID
ARG BOX_DEVELOPER_TOKEN
ARG BOX_PASSPHRASE
ARG NEXT_PUBLIC_APP_BASE_URL_WILLDAN

ENV BOX_CLIENT_ID=$BOX_CLIENT_ID
ENV BOX_CLIENT_SECRET=$BOX_CLIENT_SECRET
ENV BOX_ENTERPRISE_ID=$BOX_ENTERPRISE_ID
ENV BOX_PRIVATE_KEY=$BOX_PRIVATE_KEY
ENV BOX_PRIVATE_KEY_PASSWORD=$BOX_PRIVATE_KEY_PASSWORD
ENV BOX_PUBLIC_KEY_ID=$BOX_PUBLIC_KEY_ID
ENV BOX_DEVELOPER_TOKEN=$BOX_DEVELOPER_TOKEN
ENV BOX_PASSPHRASE=$BOX_PASSPHRASE
ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL_WILLDAN

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

# Ensure the public/uploads folder is copied correctly
COPY ./public/uploads /app/public/uploads

# Build the Next.js application
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Expose the port the app will run on
EXPOSE 3001

# Start the Next.js application
CMD ["npm", "start"]
