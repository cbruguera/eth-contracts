#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm exec 8.1.3 testrpc --network-id 1337 --account "0x6cea04364332bf02ee0d9554c6502b7b09470b94661560939efd9cca0d036d8a,10000000000000000000000" --mnemonic "elbow cream cable wash arch usage spot wet toss cousin east duty"

