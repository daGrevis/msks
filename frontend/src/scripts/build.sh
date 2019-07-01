#!/usr/bin/env bash

set -e

version=''
# rev
version="$version$(git rev-parse HEAD)"
# latestTag
version="$version\n$(git describe --tags --abbrev=0)"
# commitCount
version="$version\n$(git log --oneline $(git describe --abbrev=0 --tags)..HEAD | wc -l | awk '{ print $1 }')"
# subject
version="$version\n$(git show -s --format=%s)"
# date
version="$version\n$(git show -s --format=%ci)"

echo '<VERSION>'
echo -e "$version"
echo '</VERSION>'

REACT_APP_GIT_VERSION="$version" react-scripts build
