resource "azuread_directory_role_assignment" "main_directory_readers" {
  role_id             = azuread_directory_role.directory_readers.template_id
  principal_object_id = azuread_service_principal.main.object_id
}

resource "azurerm_role_assignment" "main_authorization_reader" {
  for_each             = { for s in local.subscriptions : s.name => s }
  scope                = "/subscriptions/${each.value.id}"
  role_definition_name = "PagoPA Authorization Reader"
  principal_id         = azuread_service_principal.main.object_id
}

resource "azurerm_role_assignment" "main_terraform_storage_account_app" {
  for_each             = { for s in local.subscriptions : s.name => s }
  scope                = "/subscriptions/${each.value.id}/resourceGroups/terraform-state-rg/providers/Microsoft.Storage/storageAccounts/${each.value.terraform_storage_account_app}"
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.main.object_id
}
