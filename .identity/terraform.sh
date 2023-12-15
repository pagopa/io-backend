#!/bin/bash

set -e

ACTION=$1
ENV=$2
shift 2
other="$@"
# must be subscription in lower case
subscription=""
BACKEND_CONFIG_PATH="./env/${ENV}/backend.tfvars"

if [ -z "$ACTION" ]; then
  echo "[ERROR] Missed ACTION: init, apply, plan"
  exit 0
fi

if [ -z "$ENV" ]; then
  echo "[ERROR] ENV should be: dev, uat or prod."
  exit 0
fi

#
# 🏁 Source & init shell
#

# shellcheck source=/dev/null
source "./env/$ENV/backend.ini"

# Subscription set
az account set -s "${subscription}"

# if using cygwin, we have to transcode the WORKDIR
if [[ $WORKDIR == /cygdrive/* ]]; then
  WORKDIR=$(cygpath -w $WORKDIR)
fi

# Helm
export HELM_DEBUG=1

#
# 🌎 Terraform
#
if echo "init plan apply refresh import output state taint destroy" | grep -w "$ACTION" > /dev/null; then
  if [ "$ACTION" = "init" ]; then
    echo "[INFO] init tf on ENV: ${ENV}"
    terraform "$ACTION" -backend-config="${BACKEND_CONFIG_PATH}" $other
  elif [ "$ACTION" = "output" ] || [ "$ACTION" = "state" ] || [ "$ACTION" = "taint" ]; then
    # init terraform backend
    terraform init -reconfigure -backend-config="${BACKEND_CONFIG_PATH}"
    terraform "$ACTION" $other
  else
    # init terraform backend
    echo "[INFO] init tf on ENV: ${ENV}"
    terraform init -reconfigure -backend-config="${BACKEND_CONFIG_PATH}"

    echo "[INFO] run tf with: ${ACTION} on ENV: ${ENV} and other: >${other}<"
    terraform "${ACTION}" -var-file="./env/${ENV}/terraform.tfvars" -compact-warnings $other
  fi
else
    echo "[ERROR] ACTION not allowed."
    exit 1
fi
