/**
 * User's Email Address.
 */

import { EmailString } from "../../utils/strings";

import * as t from "io-ts";

export type EmailAddress = t.TypeOf<typeof EmailAddress>;

export const EmailAddress = EmailString;
