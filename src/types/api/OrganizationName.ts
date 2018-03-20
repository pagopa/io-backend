import * as t from "io-ts";
import { NonEmptyString } from "../../utils/strings";

/**
 * The organizazione that runs the service. Will be added to the content of sent messages to identify the sender.
 *
 */

export type OrganizationName = t.TypeOf<typeof OrganizationName>;

export const OrganizationName = NonEmptyString;
