#!/bin/bash

set -o errexit

NETWORK="${1:-development}"

GITV="${2:-$CURR_GITV}"

echo "==> Git information"
echo "    deploying version: $GITV"

echo "==> Resetting to $GITV"
git checkout $GITV 


CV="$(git describe)"

echo "==> Verifying repository is clean"
if [[ $(git status --porcelain) ]]; then
  echo "ERROR: repository not in a clean state"
  #exit 1
fi

echo "==> Deleting old artifacts"
#find build/contracts/ -type f -exec rm "{}" \;

echo "==> Deploying version $CV to $NETWORK"
TRUFFLE_OUTPUT="$(truffle migrate --reset --network $NETWORK)"

echo "==> Extracting addresses"
CONTRACTS=("$(find build/contracts -type f)")


ADDR_JSON="{}"

for fn in $CONTRACTS; do
    fn=$(basename $fn)
    fn=${fn%.json}
    addr=$(echo "$(echo "${TRUFFLE_OUTPUT}" | grep $fn | grep 0x | awk '{print $2}')")
    if [ -z "$addr" ]; then
      echo ""
      echo "WARNING: $fn is NOT deployed in network $NETWORK"
      echo ""
    else
      echo "$fn: $addr"
      ADDR_JSON="$(echo "{\"$fn\": \"$addr\"}" | jq ". + $ADDR_JSON")"
    fi
done

RESULT_JSON="{}"
RESULT_JSON="$(echo "{\"network\": \"$NETWORK\"}" | jq ". + $RESULT_JSON")"
RESULT_JSON="$(echo "{\"version\": \"$CV\"}" | jq ". + $RESULT_JSON")"
RESULT_JSON="$(echo "{\"addresses\": $ADDR_JSON}" | jq ". + $RESULT_JSON")"


echo "==> Returning to $CURR_GITV"
git checkout -

OUTPUT="address_archive/$CV/$NETWORK.json"
echo "==> Archiving to $OUTPUT"
mkdir -p "$(dirname $OUTPUT)"
echo $RESULT_JSON | jq . > "$OUTPUT"

git add "$OUTPUT"
git commit "$OUTPUT" -m "Deployed v$CV addresses for $NETWORK"
git push
