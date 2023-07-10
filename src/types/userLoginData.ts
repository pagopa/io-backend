import * as t from "io-ts";

import {
  FiscalCode,
  IPString,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import { EmailAddress } from "../../generated/backend/EmailAddress";

/**
 * All the data related to a newly performed login
 */

// required attributes
const UserLoginParamsR = t.interface({
  email: EmailAddress,
  family_name: NonEmptyString,
  fiscal_code: FiscalCode,
  identity_provider: NonEmptyString,
  ip_address: IPString,
  name: NonEmptyString,
});

// optional attributes
const UserLoginParamsO = t.partial({
  device_name: NonEmptyString,
});

export const UserLoginParams = t.intersection(
  [UserLoginParamsR, UserLoginParamsO],
  "UserLoginParams"
);

export type UserLoginParams = t.TypeOf<typeof UserLoginParams>;
