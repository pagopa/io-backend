resource "azurerm_api_management_api_version_set" "io_backend_app_api_v2" {
  name                = format("%s-io-backend-app-api", var.env_short)
  resource_group_name = var.apim_resource_group_name
  api_management_name = var.apim_name
  display_name        = "${local.apim_v2_io_backend_api.display_name} - app"
  versioning_scheme   = "Segment"
}

module "apim_v2_io_backend_app_api_v1" {
  source = "github.com/pagopa/terraform-azurerm-v3//api_management_api?ref=v8.27.0"

  name                  = format("%s-io-backend-app-api", var.env_short)
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name

  product_ids           = [module.apim_v2_io_backend_product.product_id]
  subscription_required = local.apim_v2_io_backend_api.subscription_required
  version_set_id        = azurerm_api_management_api_version_set.io_backend_app_api_v2.id
  api_version           = "v1"
  service_url           = local.apim_v2_io_backend_api.service_url

  description  = "${local.apim_v2_io_backend_api.description} - app"
  display_name = "${local.apim_v2_io_backend_api.display_name} - app"
  path         = "${local.apim_v2_io_backend_api.path}/app"
  protocols    = ["https"]

  content_format = "swagger-json"
  content_value = templatefile("../assets/app/v1/_swagger_v2.json.tpl", {
    host = "api-app.internal.io.pagopa.it"
  })

  xml_content = file("../assets/app/v1/_base_policy.xml")
  api_operation_policies = [
    {
      operation_id = "getUserMessages"
      xml_content  = file("../assets/app/v1/operations/getUserMessages.xml")
    }
  ]
}
