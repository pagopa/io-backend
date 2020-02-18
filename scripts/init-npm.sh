#!/usr/bin/env bash

echo registry=https://registry.npmjs.com/ >> .npmrc
echo \//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN >> .npmrc
echo \@pagopa:registry=https://npm.pkg.github.com/ >> .npmrc