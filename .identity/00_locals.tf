locals {
  github = {
    org        = "pagopa"
    repository = "pagopa-authorization"
  }
  subscriptions = [
    {
      name                          = "COMMON"
      id                            = "1fa3dd86-a404-4a89-af1f-9350a2ac0894"
      terraform_storage_account_app = "tfappcommon"
    },
    {
      name                          = "DEV-CSTAR"
      id                            = "4d177dd6-5c7d-40ab-8019-0c1be380a25d"
      terraform_storage_account_app = "tfappdevcstar"
    },
    {
      name                          = "DEV-IO"
      id                            = "a4e96bcd-59dc-4d66-b2f7-5547ad157c12"
      terraform_storage_account_app = "tfappdevio"
    },
    {
      name                          = "DEV-pagoPA"
      id                            = "bbe47ad4-08b3-4925-94c5-1278e5819b86"
      terraform_storage_account_app = "tfappdevpagopa"
    },
    {
      name                          = "DEV-SelfCare"
      id                            = "1ab5e788-3b98-4c63-bd05-de0c7388c853"
      terraform_storage_account_app = "tfappdevselfcare"
    },
    {
      name                          = "DEV-SWCLIENT"
      id                            = "000df80e-d061-4064-998e-d4e32146d17b"
      terraform_storage_account_app = "tfappdevswclient"
    },
    {
      name                          = "DevOpsAutomation"
      id                            = "eecb6e5c-a257-4994-bc32-eb79ca8e8a9a"
      terraform_storage_account_app = "tfappdevopsautomation"
    },
    {
      name                          = "DevOpsLab"
      id                            = "ac17914c-79bf-48fa-831e-1359ef74c1d5"
      terraform_storage_account_app = "tfappdevopslab"
    },
    {
      name                          = "ORG"
      id                            = "a001fc05-3125-4940-bbe0-7ef4125a8263"
      terraform_storage_account_app = "tfapporg"
    },
    {
      name                          = "PROD-CSTAR"
      id                            = "88c709b0-11cf-4450-856e-f9bf54051c1d"
      terraform_storage_account_app = "tfappprodcstar"
    },
    {
      name                          = "PROD-Esercenti"
      id                            = "74da48a3-b0e7-489d-8172-da79801086ed"
      terraform_storage_account_app = "tfappprodesercenti"
    },
    {
      name                          = "PROD-IO"
      id                            = "ec285037-c673-4f58-b594-d7c480da4e8b"
      terraform_storage_account_app = "tfappprodio"
    },
    {
      name                          = "PROD-pagoPA"
      id                            = "b9fc9419-6097-45fe-9f74-ba0641c91912"
      terraform_storage_account_app = "tfappprodpagopa"
    },
    {
      name                          = "Prod-Sec"
      id                            = "0da48c97-355f-4050-a520-f11a18b8be90"
      terraform_storage_account_app = "tfappprodsec"
    },
    {
      name                          = "Prod-SelfCare"
      id                            = "813119d7-0943-46ed-8ebe-cebe24f9106c"
      terraform_storage_account_app = "tfappprodselfcare"
    },
    {
      name                          = "PROD-SITECORP"
      id                            = "e7799d11-87a7-4c8f-a260-5539dc9c0e10"
      terraform_storage_account_app = "tfappprodsitecorp"
    },
    {
      name                          = "PROD-SWCLIENT"
      id                            = "d329da34-8a62-4fc1-8178-d0cf9189ece2"
      terraform_storage_account_app = "tfappprodswclient"
    },
    {
      name                          = "UAT-CSTAR"
      id                            = "f9f0ed60-4b4b-49a6-97cb-8c8a0f9e2435"
      terraform_storage_account_app = "tfappuatcstar"
    },
    {
      name                          = "UAT-Esercenti"
      id                            = "d1a90d9f-6ee1-4fb2-a149-7aedbf3ed49d"
      terraform_storage_account_app = "tfappuatesercenti"
    },
    {
      name                          = "UAT-IO"
      id                            = "3317594a-014b-44ac-b9fe-5783c53b8b32"
      terraform_storage_account_app = "tfappuatio"
    },
    {
      name                          = "UAT-pagoPA"
      id                            = "26abc801-0d8f-4a6e-ac5f-8e81bcc09112"
      terraform_storage_account_app = "tfappuatpagopa"
    },
    {
      name                          = "UAT-SelfCare"
      id                            = "f47d50dc-b874-4e04-9d5c-c27f5053a651"
      terraform_storage_account_app = "tfappuatselfcare"
    },
    {
      name                          = "UAT-SITECORP"
      id                            = "1d1dba80-d17b-4aec-ad55-b751b928eea0"
      terraform_storage_account_app = "tfappuatsitecorp"
    },
    {
      name                          = "UAT-SWCLIENT"
      id                            = "3b91354c-5956-4c35-b711-afeecb164933"
      terraform_storage_account_app = "tfappuatswclient"
    },
  ]
}
