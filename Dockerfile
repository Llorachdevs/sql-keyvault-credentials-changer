######################################################################################################################################################
# Install dependencies only when needed
FROM node:14-bullseye AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.

ARG KEYVAULT_TENNANT_ID
ARG KEYVAULT_CLIENT_ID
ARG KEYVAULT_CLIENT_SECRET
ARG KEY_VAULT_NAME
ARG ENV_FILE_NAME

RUN apt update
RUN apt install libc6 curl -y
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

RUN az login --service-principal -u ${KEYVAULT_CLIENT_ID} -p ${KEYVAULT_CLIENT_SECRET} --tenant ${KEYVAULT_TENNANT_ID}

WORKDIR /app
COPY ./ ./keyvault-envs
RUN ls -al
WORKDIR /app/keyvault-envs
RUN ls -al
RUN npm install
RUN node index.js --KEYVAULT_TENNANT_ID ${KEYVAULT_TENNANT_ID} --KEYVAULT_CLIENT_ID ${KEYVAULT_CLIENT_ID} --KEYVAULT_CLIENT_SECRET ${KEYVAULT_CLIENT_SECRET} --KEY_VAULT_NAME ${KEY_VAULT_NAME} --ENV_FILE_NAME ${ENV_FILE_NAME}
#######################################################################################################################################################
