import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

/**
 * The organizazione that runs the service. Will be added to the content of sent messages to identify the sender.
 *
 */

export type OrganizationName = t.TypeOf<typeof OrganizationName>;

export const OrganizationName = NonEmptyString;
