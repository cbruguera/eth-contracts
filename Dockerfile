FROM dougvk/truffle3:latest

MAINTAINER Ingemars Asmanis "ingemars.asmanis@notakey.com"

# RUN apt-get install -y software-properties-common

# RUN add-apt-repository -y ppa:ethereum/ethereum && apt-get update && apt-get install solc

RUN rm -rf /app/node_modules

# Upgrade to latest
RUN npm uninstall truffle && npm install truffle 

RUN npm install -g eth-gas-reporter 

WORKDIR /app

COPY ./docker/docker-entrypoint.sh /usr/local/bin/

COPY ./truffle.js /app/truffle.js

COPY ./contracts /app/

# RUN truffle compile 

# RUN truffle migrate 

WORKDIR /app

# CMD ["bash"]

# ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

ENTRYPOINT ["/bin/bash"]
