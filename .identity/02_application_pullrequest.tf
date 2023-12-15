resource "azuread_application" "pullrequest" {
  display_name = "github-${local.github.org}-${local.github.repository}-pullrequest"
}

resource "azuread_service_principal" "pullrequest" {
  application_id = azuread_application.pullrequest.application_id
}

resource "azuread_application_federated_identity_credential" "pullrequest" {
  application_object_id = azuread_application.pullrequest.object_id
  display_name          = "github-federated"
  description           = "github-federated"
  audiences             = ["api://AzureADTokenExchange"]
  issuer                = "https://token.actions.githubusercontent.com"
  subject               = "repo:${local.github.org}/${local.github.repository}:pull_request"
}

output "azure_pullrequest_client_id" {
  value = azuread_service_principal.pullrequest.application_id
}

output "azure_pullrequest_application_id" {
  value = azuread_service_principal.pullrequest.application_id
}

output "azure_pullrequest_object_id" {
  value = azuread_service_principal.pullrequest.object_id
}
