terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "iopitntfst001"
    container_name       = "terraform-state"
    key                  = "io-backend.github-runner.tfstate"
  }
}

provider "azurerm" {
  features {
  }
}

data "azurerm_container_app_environment" "github-runner-cae" {
  name                = "io-p-itn-github-runner-cae-01"
  resource_group_name = "io-p-itn-github-runner-rg-01"
}


locals {
  prefix    = "io"
  env_short = "p"
  location  = "italynorth"

  tags = {
    CostCenter     = "TS000 - Tecnologia e Servizi"
    CreatedBy      = "Terraform"
    Environment    = "App IO"
    ManagementTeam = "IO Platform"
    Source         = "https://github.com/pagopa/io-backend/blob/main/infra/github-runner/prod"
  }
}


module "dx-github-selfhosted-runner-on-container-app-jobs" {
  source  = "pagopa/dx-github-selfhosted-runner-on-container-app-jobs/azurerm"
  version = "~> 1"
  repository = { name : "io-backend" }

  environment = {
    prefix          = "io"
    env_short       = "p"
    location        = "italynorth"
    instance_number = "01"
  }

  container_app_environment = {
    id                         = data.azurerm_container_app_environment.github-runner-cae.id
    location                   = "italynorth"
    replica_timeout_in_seconds = 3600
  }

  resource_group_name = "io-p-rg-linux"

  key_vault = {
    name                = "io-p-kv-common"
    resource_group_name = "io-p-rg-common"
  }

  tags = local.tags
}
