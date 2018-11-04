# You should always specify a full version here to ensure all of your developers
# are running the same version of Node.
FROM node:9

# The base node image sets a very verbose log level.
ENV NPM_CONFIG_LOGLEVEL warn

RUN yarn config set registry "https://registry.npmjs.org"

COPY package.json .
COPY yarn.lock .

RUN yarn install

# Copy all local files into the image.
COPY . .

# Build for production.
RUN yarn run build

# Set the command to start the node server.
CMD ["./node_modules/.bin/serve", "-l", "3000", "-s", "build"]

# Tell Docker about the port we'll run on.
EXPOSE 3000
