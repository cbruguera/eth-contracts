#!/bin/bash

# set -o errexit

TESTRPC=$(ps ax | grep bin/testrpc | grep -v grep || true)
if [ ! -z "$TESTRPC" ]; then
  echo "ERROR: testrpc is running (please close it!)"
  exit 1
fi


NETWORK="${1}"
if [ -z "$NETWORK" ]; then
  echo "Please pass network name/id as the first parameter"
  exit 1
fi

GITV="${2}"
if [ -z "$GITV" ]; then
  echo "Please pass version tag as the second parameter"
  exit 1
fi

localbranch="$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')"

echo "==> Git information"
echo "    deploying version: $GITV"

echo "==> Resetting to $GITV"
git checkout $GITV &> /dev/null

if [ $? -ne 0 ]; then
        echo "Checkout of tag $GITV failed"
        exit 1
fi

CV="$(git describe)" # Should match GITV

echo "==> Deploying version $CV to $NETWORK"
echo "    removing old build artifacts"
find build/contracts -type f -exec rm "{}" \;
echo "    migrating"
TRUFFLE_OUTPUT="$(truffle migrate --reset --network $NETWORK)"

if [ $? -ne 0 ]; then
	echo "Truffle migrate failed: ${TRUFFLE_OUTPUT}" 
	git checkout "$localbranch"
	exit 1
fi  

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

echo "==> Returning to previous git state"
git checkout -

echo "==> Writing files"
NETWORKDIR="deployed/$NETWORK"
mkdir -p "$NETWORKDIR"
mkdir -p "$NETWORKDIR/$CV"

echo $CV > "$NETWORKDIR/VERSION"
echo $RESULT_JSON | jq . > "$NETWORKDIR/$CV/manifest.json"
cp -rv build/contracts/* "$NETWORKDIR/$CV"

git add "$NETWORKDIR"
git commit "$NETWORKDIR" -m "Deployed v$CV addresses for $NETWORK"
git push
git checkout "$localbranch"
