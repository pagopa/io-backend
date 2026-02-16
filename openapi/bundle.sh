#!/bin/bash

VERSION=$1

find . -type f -name "*.template.yaml" | while IFS= read -r filename
do 
    name=$(basename "$filename" .template.yaml)
    pnpm dlx bundle-api-spec -i openapi/$name.template.yaml -o openapi/generated/$name.yaml -V "$VERSION"

done
