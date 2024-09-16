resource "azurerm_api_management_api_version_set" "io_backend_notifications_api_v2" {
  name                = format("%s-io-backend-notifications-api", var.env_short)
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "${local.apim_v2_io_backend_api.display_name} - notifications"
  versioning_scheme   = "Segment"
}

module "apim_v2_io_backend_notifications_api_v1" {
  source = "github.com/pagopa/terraform-azurerm-v3//api_management_api?ref=v8.27.0"

  name                  = format("%s-io-backend-notifications-api", var.env_short)
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name

  product_ids           = [module.apim_v2_io_backend_product.product_id]
  subscription_required = local.apim_v2_io_backend_api.subscription_required
  version_set_id        = azurerm_api_management_api_version_set.io_backend_notifications_api_v2.id
  api_version           = "v1"
  service_url           = local.apim_v2_io_backend_api.service_url

  description  = "${local.apim_v2_io_backend_api.description} - notifications"
  display_name = "${local.apim_v2_io_backend_api.display_name} - notifications"
  path         = "${local.apim_v2_io_backend_api.path}/notifications"
  protocols    = ["https"]

  content_format = "swagger-json"
  content_value = templatefile("../assets/notifications/v1/_swagger.json.tpl", {
    host = var.api_host_name
  })

  xml_content = file("../assets/notifications/v1/_base_policy.xml")
}
