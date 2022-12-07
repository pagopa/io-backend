resource "azuread_application" "main" {
  display_name = "github-${local.github.org}-${local.github.repository}-main"
}

resource "azuread_service_principal" "main" {
  application_id = azuread_application.main.application_id
}

resource "azuread_application_federated_identity_credential" "main" {
  application_object_id = azuread_application.main.object_id
  display_name          = "github-federated"
  description           = "github-federated"
  audiences             = ["api://AzureADTokenExchange"]
  issuer                = "https://token.actions.githubusercontent.com"
  subject               = "repo:${local.github.org}/${local.github.repository}:ref:refs/heads/main"
}

output "azure_main_client_id" {
  value = azuread_service_principal.main.application_id
}

output "azure_main_application_id" {
  value = azuread_service_principal.main.application_id
}

output "azure_main_object_id" {
  value = azuread_service_principal.main.object_id
}
