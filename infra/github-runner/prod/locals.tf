locals {
  prefix         = "io"
  env_short      = "p"
  location       = "italynorth"
  location_short = "itn"

  tags = {
    CostCenter     = "TS000 - Tecnologia e Servizi"
    CreatedBy      = "Terraform"
    Environment    = "App IO"
    ManagementTeam = "IO Platform"
    Source         = "https://github.com/pagopa/io-backend/blob/main/infra/github-runner/prod"
  }
}
