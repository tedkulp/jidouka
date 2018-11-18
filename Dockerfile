FROM node

# Setup final directory (for caching)
RUN mkdir /myapp
WORKDIR /myapp

COPY backend/package.json .
COPY backend/yarn.lock .

RUN yarn install --production

# Build frontend
RUN mkdir /frontend-build
WORKDIR /frontend-build

COPY frontend/package.json .
COPY frontend/yarn.lock .

RUN yarn install

ADD ./frontend/ /frontend-build/

RUN yarn run build

# Build backend
RUN mkdir /backend-build
WORKDIR /backend-build

COPY backend/package.json .
COPY backend/yarn.lock .

RUN yarn install

ADD ./backend/ /backend-build/

RUN yarn run build

# Build the final deal
WORKDIR /myapp

RUN cp -r /backend-build/build/. .

RUN mkdir /myapp/client
RUN cp -r /frontend-build/build/. /myapp/client/

# Cleanup
RUN rm -fr /frontend-build
RUN rm -fr /backend-build

# CMD ["yarn", "run", "dev"]
CMD ["node", "index.js"]

EXPOSE 4000
