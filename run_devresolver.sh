#!/bin/bash

VERSION=dev
NETWORK=development
NETWORKDIR="deployed/$NETWORK"

echo "==> Preparing ABI files"

echo "    VERSION"
mkdir -p "$NETWORKDIR/$VERSION"
echo $VERSION > $NETWORKDIR/VERSION

echo "    building manifest (TODO: move into devresolver.js to be on-the-fly)"

CONTRACTS=("$(find build/contracts -type f)")
ADDR_JSON="{}"
for fn in $CONTRACTS; do
    fn=$(basename $fn)
    fn=${fn%.json}
    addr="<TAKEN FROM BUILD ARTIFACT FILE>"
    if [ -z "$addr" ]; then
      echo ""
      echo "        WARNING: $fn is NOT deployed in network $NETWORK"
      echo ""
    else
      echo "        $fn: $addr"
      ADDR_JSON="$(echo "{\"$fn\": \"$addr\"}" | jq ". + $ADDR_JSON")"
    fi
done
RESULT_JSON="{}"
RESULT_JSON="$(echo "{\"network\": \"$NETWORK\"}" | jq ". + $RESULT_JSON")"
RESULT_JSON="$(echo "{\"version\": \"$VERSION\"}" | jq ". + $RESULT_JSON")"
RESULT_JSON="$(echo "{\"addresses\": $ADDR_JSON}" | jq ". + $RESULT_JSON")"

echo $RESULT_JSON | jq . > "$NETWORKDIR/$VERSION/manifest.json"

echo "    linking build artifacts"
find build/contracts -type f -iname "*.json" -print0 | while IFS= read -r -d $'\0' line; do
    target="$NETWORKDIR/$VERSION/$(basename $line)"
    echo "        linking $line to $target"
    ln -sf "$(realpath "$line")" "$target"
done


echo "==> Running devresolver"
node devresolver.js
