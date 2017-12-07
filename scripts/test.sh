#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the testrpc instance that we started (if we started one and if it's still running).
  if [ -n "$testrpc_pid" ] && ps -p $testrpc_pid > /dev/null; then
    kill -9 $testrpc_pid
  fi
}

if [ "$SOLIDITY_COVERAGE" = true ]; then
  testrpc_port=8555
else
  testrpc_port=8545
fi

testrpc_running() {
  nc -z localhost "$testrpc_port"
}

start_testrpc() {
  # We define 10 accounts with balance 1M ether, needed for high-value tests.
  
  local accounts=(
    --account="0x6cea04364332bf02ee0d9554c6502b7b09470b94661560939efd9cca0d036d8a,1000000000000000000000000"
    --account="0x22de1d112a1dc0d90b337614272ff17e7e642f8762942b3616ea5a67ca543e94,1000000000000000000000000"
    --account="0x22de1d112a1dc0d90b337614272ff17e7e642f8762942b3616ea5a67ca543e95,1000000000000000000000000"
    --account="0x22de1d112a1dc0d90b337614272ff17e7e642f8762942b3616ea5a67ca543e96,1000000000000000000000000"
  )

  if [ "$SOLIDITY_COVERAGE" = true ]; then
    node_modules/.bin/testrpc-sc --gasLimit 0xfffffffffff --port "$testrpc_port" "${accounts[@]}" --network-id 1337 > /dev/null &
  else
    node_modules/.bin/testrpc --gasLimit 0xfffffffffff "${accounts[@]}" --network-id 1337 > /dev/null &
  fi

  testrpc_pid=$!
}

if testrpc_running; then
  echo "Using existing testrpc instance"
else
  echo "Starting our own testrpc instance"
  start_testrpc
fi

if [ "$SOLIDITY_COVERAGE" = true ]; then
  node_modules/.bin/solidity-coverage

  if [ "$CONTINUOUS_INTEGRATION" = true ]; then
    cat coverage/lcov.info | node_modules/.bin/coveralls
  fi
else
  node_modules/.bin/truffle test "$@"
fi
