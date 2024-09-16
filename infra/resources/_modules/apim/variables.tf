variable "apim_name" {
  type = string
  description = "APIM name"
}

variable "apim_resource_group_name" {
  type = string
  description = "APIM resource group name"
}

variable "env_short" {
  type = string
  description = "Environment in short form"
}

variable "api_host_name" {
  type = string
  description = "Host to use in Swagger files"
}
