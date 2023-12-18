resource "github_repository_environment" "prod_ci" {
  environment = "${var.env}-ci"
  repository  = local.github.repository
}

resource "github_repository_environment" "prod_cd" {
  environment = "${var.env}-cd"
  repository  = local.github.repository
}

resource "github_actions_secret" "repo_secrets" {
  for_each        = local.env_secrets
  repository      = local.github.repository
  secret_name     = each.key
  plaintext_value = each.value
}

resource "github_actions_environment_secret" "github_environment_ci_secrets" {
  for_each        = local.env_secrets_ci
  repository      = local.github.repository
  environment     = github_repository_environment.prod_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}

resource "github_actions_environment_secret" "github_environment_cd_secrets" {
  for_each        = local.env_secrets_cd
  repository      = local.github.repository
  environment     = github_repository_environment.prod_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}
