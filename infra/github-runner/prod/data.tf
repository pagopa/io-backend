data "azurerm_container_app_environment" "github-runner-cae" {
  name                = "${local.prefix}-${local.env_short}-${local.location_short}-github-runner-cae-01"
  resource_group_name = "${local.prefix}-${local.env_short}-${local.location_short}-github-runner-rg-01"
}
