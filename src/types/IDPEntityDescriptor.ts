import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

export const IDPEntityDescriptor = t.interface({
  cert: t.refinement(
    t.readonlyArray(NonEmptyString, "array of not empty string"),
    a => a.length > 0,
    "non empty array"
  ),

  entityID: t.string,

  entryPoint: t.string,

  logoutUrl: t.string
});

export type IDPEntityDescriptor = t.TypeOf<typeof IDPEntityDescriptor>;
