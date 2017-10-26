#!/bin/bash

TESTRPC=$(ps ax | grep bin/testrpc | grep -v grep)
if [ -z "$TESTRPC" ]; then
  echo "ERROR: testrpc not running (please run it for tests)"
  exit 1
fi

VERSION_BUMP_LEVEL=$1

if [ -z "$(which truffle)" ]; then
  echo "Truffle not available. Do you need to run 'nvm use ...'?"
  exit 1;
fi 

if [ "$VERSION_BUMP_LEVEL" == "-p" ]; then
  echo "Bumping patch version number."
elif [ "$VERSION_BUMP_LEVEL" == "-m" ]; then
  echo "Bumping minor version number."
elif [ "$VERSION_BUMP_LEVEL" == "-M" ]; then
  echo "Bumping major version number."
else
  echo "Please pass -[p|m|M] to specify which version number part needs to be bumped."
  exit 1
fi

function ensure_git_clean {
  echo "==> Verifying repository is clean"
  if [[ $(git status --porcelain) ]]; then
    echo "ERROR: repository not in a clean state"
    exit 1
  fi

  echo "==> Verifying local branch is not ahead of remote"
  GITBRANCH=$(git rev-parse --abbrev-ref HEAD)
  GITAHEAD="$(git log origin/$GITBRANCH..$GITBRANCH)"
  if [ "$?" != "0" ]; then
    echo "ERROR: failed to verify against upstream branch $GITBRANCH"
    exit 1
  fi

  if [ "$GITBRANCH" != "master" ]; then
    echo "ERROR: it appears you are on a non-master branch. This is not allowed"
    exit 1
  fi

  if [ ! -z "$GITAHEAD" ]; then
    echo "ERROR: it appears you have git changes that have not been pushed upstream. Building not allowed."
    exit 1
  fi
}

ensure_git_clean

OLDVERSION=$(cat VERSION)
NEWVERSION=$(./increment_version.sh $VERSION_BUMP_LEVEL $OLDVERSION)
echo "Old version: $OLDVERSION"
echo "New version: $NEWVERSION"

EXPECTED_CHANGELOG="changelogs/$NEWVERSION.md"
if [ ! -f "$EXPECTED_CHANGELOG" ]; then
  echo "ERROR: changelog not found (expected file $EXPECTED_CHANGELOG)"
  echo ""
  read -p "Press any key to view commits between $OLDVERSION and HEAD ... "
  ./changelog.sh $OLDVERSION
  echo ""
  echo "Please use this information to write a changelog, and place it in ./$EXPECTED_CHANGELOG"
  echo "(use './changelog.sh $OLDVERSION' to see the commits since the previous version)"
  exit 1
fi


if [ -z "$(git describe | grep $OLDVERSION)" ]; then
  echo "ERROR: Can not increment ('git describe' indicates state is not directly descendent from previous version)"
  exit 1
fi

if git rev-parse $NEWVERSION >/dev/null 2>&1; then
  echo "ERROR: New version tag exists already"
  exit 1
fi

truffle test
if [ "$?" != "0" ]; then
  echo "ERROR: tests failed"
  exit 1
fi

truffle compile
mkdir -p "abi_archive/$NEWVERSION/"
cp -rv build/contracts/* "abi_archive/$NEWVERSION"

git add "abi_archive/$NEWVERSION"
git commit "abi_archive/$NEWVERSION" -m "Prepared ABI files for v$NEWVERSION"

echo $NEWVERSION > VERSION
GIT_MESSAGE="Version bump from $OLDVERSION to $NEWVERSION"

git commit VERSION -m "$GIT_MESSAGE"
git push

git tag -a "$NEWVERSION" -m "$GIT_MESSAGE"
git push --tags

echo ""
echo "Now run ./deploy_and_archive_addresses.sh"
echo ""
