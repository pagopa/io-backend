import { NonEmptyString, Ulid } from "@pagopa/ts-commons/lib/strings";
import { RCConfigurationBase } from "../../generated/io-messages-api/RCConfigurationBase";
import { HasPreconditionEnum } from "../../generated/communication/HasPrecondition";
import { RCConfigurationPublic } from "../../generated/io-messages-api/RCConfigurationPublic";
import { aFiscalCode } from "./user_mock";

const aRemoteContentEnvironmentConfiguration = {
    base_url: "https://aBaseUrl" as NonEmptyString,
    details_authentication: {
      header_key_name: "X-Functions-Key" as NonEmptyString,
      key: "anykey" as NonEmptyString,
      type: "API_KEY" as NonEmptyString
    }
  };
  
  const aRemoteContentConfigurationWithNoEnv: RCConfigurationBase = {
    configuration_id: "01HMRBX079WA5SGYBQP1A7FSKH" as Ulid,
    name: "aName" as NonEmptyString,
    description: "a simple description" as NonEmptyString,
    has_precondition: HasPreconditionEnum.ALWAYS,
    disable_lollipop_for: [aFiscalCode],
    is_lollipop_enabled: true,
  };
  
  export const aRemoteContentConfigurationWithBothEnv: RCConfigurationPublic = {
    ...aRemoteContentConfigurationWithNoEnv,
    prod_environment: aRemoteContentEnvironmentConfiguration,
    test_environment: {
      ...aRemoteContentEnvironmentConfiguration,
      test_users: [aFiscalCode]
    }
  };