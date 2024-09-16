module "apim_v2_io_backend_product" {
  source = "github.com/pagopa/terraform-azurerm-v3//api_management_product?ref=v8.27.0"

  product_id   = "io-backend"
  display_name = "IO BACKEND"
  description  = "Product for IO backend"

  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name

  published             = true
  subscription_required = true
  approval_required     = false

  policy_xml = file("../assets/products/_base_policy.xml")
}
