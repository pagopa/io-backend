#!/bin/sh

if [ -z "$1" ]
  then
    echo "Usage: $0 <cert-path>"
		exit
fi

#
# Generates testing certificates
#

if [ -e $1/cert.pem ] && [ -e $1/key.pem ]
then
	echo "Test certificates already existing"
else
	echo "Generating certificates in $1"
	cd $1
	openssl req -sha256 -x509 -nodes -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -subj "/C=IT/ST=Italy/L=Rome/O=ACME/OU=IT Department/CN=api.italia.local"
fi
