resource "azuread_application" "master" {
  display_name = "github-${local.github.org}-${local.github.repository}-master"
}

resource "azuread_service_principal" "master" {
  application_id = azuread_application.master.application_id
}

resource "azuread_application_federated_identity_credential" "master" {
  application_object_id = azuread_application.master.object_id
  display_name          = "github-federated"
  description           = "github-federated"
  audiences             = ["api://AzureADTokenExchange"]
  issuer                = "https://token.actions.githubusercontent.com"
  subject               = "repo:${local.github.org}/${local.github.repository}:ref:refs/heads/master"
}

output "azure_master_client_id" {
  value = azuread_service_principal.master.application_id
}

output "azure_master_application_id" {
  value = azuread_service_principal.master.application_id
}

output "azure_master_object_id" {
  value = azuread_service_principal.master.object_id
}
