# Use the official Node.js image as the base image
FROM node:22-alpine

# Set environment variables for Box SDK (for example purposes)
ARG BOX_CLIENT_ID
ARG BOX_CLIENT_SECRET
ARG BOX_ENTERPRISE_ID
ARG BOX_PRIVATE_KEY
ARG BOX_PRIVATE_KEY_PASSWORD
ARG BOX_PUBLIC_KEY_ID
ARG BOX_DEVELOPER_TOKEN
ARG BOX_PASSPHRASE
ARG NEXT_PUBLIC_APP_BASE_URL
ARG NEXT_PUBLIC_JWT_SECRET_KEY
ARG AZURE_COMMUNICATION_CONNECTION_STRING
ARG AZURE_COMMUNICATION_SENDER_EMAIL
ARG NEXT_PUBLIC_OKTA_CLIENT_ID
ARG NEXT_PUBLIC_OKTA_ISSUER
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG AZURE_STORAGE_CONNECTION_STRING
ARG NEXT_PUBLIC_CRYPTO_SECRET_KEY

ENV BOX_CLIENT_ID=$BOX_CLIENT_ID
ENV BOX_CLIENT_SECRET=$BOX_CLIENT_SECRET
ENV BOX_ENTERPRISE_ID=$BOX_ENTERPRISE_ID
ENV BOX_PRIVATE_KEY=$BOX_PRIVATE_KEY
ENV BOX_PRIVATE_KEY_PASSWORD=$BOX_PRIVATE_KEY_PASSWORD
ENV BOX_PUBLIC_KEY_ID=$BOX_PUBLIC_KEY_ID
ENV BOX_DEVELOPER_TOKEN=$BOX_DEVELOPER_TOKEN
ENV BOX_PASSPHRASE=$BOX_PASSPHRASE
ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL
ENV NEXT_PUBLIC_JWT_SECRET_KEY=$NEXT_PUBLIC_JWT_SECRET_KEY
ENV AZURE_COMMUNICATION_CONNECTION_STRING=$AZURE_COMMUNICATION_CONNECTION_STRING
ENV AZURE_COMMUNICATION_SENDER_EMAIL=$AZURE_COMMUNICATION_SENDER_EMAIL
ENV NEXT_PUBLIC_OKTA_CLIENT_ID=$NEXT_PUBLIC_OKTA_CLIENT_ID
ENV NEXT_PUBLIC_OKTA_ISSUER=$NEXT_PUBLIC_OKTA_ISSUER
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV AZURE_STORAGE_CONNECTION_STRING=$AZURE_STORAGE_CONNECTION_STRING
ENV NEXT_PUBLIC_CRYPTO_SECRET_KEY=$NEXT_PUBLIC_CRYPTO_SECRET_KEY

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
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Expose the port the app will run on
EXPOSE 3008

# Start the Next.js application
CMD ["npm", "start"]
