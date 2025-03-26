FROM node:22

ENV NEXT_TELEMETRY_DISABLED 1

COPY ./apps/towndex-gui /sdapps/apps/towndex-gui
COPY ./packages /sdapps/packages
COPY package.json package-lock.json tsconfig.json turbo.json /sdapps

# Install packages
RUN cd /sdapps && npm install && npm run build

# Delete files we don't need 
RUN rm -fr /root/.cache && yarn cache clean
