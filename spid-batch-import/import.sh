#!/bin/sh

yarn install

node spid-idp-userimport.js

node spid-idp-spimport.js
