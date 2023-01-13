resource "azurerm_role_assignment" "pullrequest_terraform_subscription" {
  scope                = data.azurerm_subscription.current.id
  role_definition_name = "Reader"
  principal_id         = azuread_service_principal.pullrequest.object_id
}

resource "azurerm_role_assignment" "pullrequest_terraform_storage_account_tfstate_app" {
  scope                = data.azurerm_storage_account.tfstate_app.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.pullrequest.object_id
}

resource "azurerm_role_assignment" "pullrequest_terraform_resource_group_dashboards" {
  scope                = data.azurerm_resource_group.dashboards.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.pullrequest.object_id
}
