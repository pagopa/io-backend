
module "apim_weu" {
  source = "../_modules/apim"

  env_short = local.env_short

  apim_name                = data.azurerm_api_management.apim.name
  apim_resource_group_name = data.azurerm_api_management.apim.resource_group_name

  api_host_name = "api-app.internal.io.pagopa.it"
}
