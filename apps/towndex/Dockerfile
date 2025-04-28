FROM node:22

ENV NEXT_TELEMETRY_DISABLED 1

COPY ./apps/towndex /sdapps/apps/towndex
COPY ./packages /sdapps/packages
COPY ./package.json ./package-lock.json ./turbo.json /sdapps

# Install packages
RUN cd /sdapps && npm install && npm run build:packages

# Delete files we don't need 
RUN rm -fr /root/.cache && yarn cache clean
