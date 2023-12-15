data "azurerm_storage_account" "tfstate_app" {
  name                = "tfapp${lower(replace(data.azurerm_subscription.current.display_name, "-", ""))}"
  resource_group_name = "terraform-state-rg"
}

data "azurerm_resource_group" "dashboards" {
  name = "dashboards"
}
