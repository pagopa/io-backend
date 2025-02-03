import * as t from "io-ts";
import { nonEmptyArray as createNonEmptyArrayFromArray } from "io-ts-types/lib/nonEmptyArray";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export const IDPEntityDescriptor = t.interface({
  cert: createNonEmptyArrayFromArray(NonEmptyString),

  entityID: t.string,

  entryPoint: t.string,

  logoutUrl: t.string,
});

export type IDPEntityDescriptor = t.TypeOf<typeof IDPEntityDescriptor>;
