variable "tags" {
  type = map(any)
  default = {
    CreatedBy   = "Terraform"
    Environment = "Prod"
    Owner       = "IO"
    Source      = "https://github.com/pagopa/io-services-metadata"
    CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
  }
}

variable "prefix" {
  type = string
}

variable "env" {
  type = string
}

variable "env_short" {
  type = string
}

variable "domain" {
  type = string
}

variable "ci_github_federations" {
  type = list(object({
    repository        = string
    credentials_scope = optional(string, "environment")
    subject           = string
  }))
  description = "GitHub Organization, repository name and scope permissions"
}

variable "environment_ci_roles" {
  type = object({
    subscription    = list(string)
    resource_groups = map(list(string))
  })
  description = "GitHub Continous Delivery roles"
}

variable "cd_github_federations" {
  type = list(object({
    repository        = string
    credentials_scope = optional(string, "environment")
    subject           = string
  }))
  description = "GitHub Organization, repository name and scope permissions"
}

variable "environment_cd_roles" {
  type = object({
    subscription    = list(string)
    resource_groups = map(list(string))
  })
  description = "GitHub Continous Delivery roles"
}
