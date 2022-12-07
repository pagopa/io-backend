data "azurerm_storage_account" "tfstate_app" {
  name                = "tfappprodio"
  resource_group_name = "terraform-state-rg"
}

data "azurerm_resource_group" "dashboards" {
  name = "dashboards"
}
