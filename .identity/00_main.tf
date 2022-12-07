terraform {
  required_version = ">=1.3.0"

  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "2.30.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.33.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfappcommon"
    container_name       = "terraform-state"
    key                  = "github-pagopa-authorization.tfstate"
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}
