module "dx-github-selfhosted-runner-on-container-app-jobs" {
  source     = "pagopa/dx-github-selfhosted-runner-on-container-app-jobs/azurerm"
  version    = "~> 1"
  repository = { name : "io-backend" }

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    instance_number = "01"
  }

  container_app_environment = {
    id                         = data.azurerm_container_app_environment.github-runner-cae.id
    location                   = local.location
    replica_timeout_in_seconds = 3600
  }

  resource_group_name = "${local.prefix}-${local.env_short}-rg-linux"

  key_vault = {
    name                = "${local.prefix}-${local.env_short}-kv-common"
    resource_group_name = "${local.prefix}-${local.env_short}-rg-common"
  }

  tags = local.tags
}
