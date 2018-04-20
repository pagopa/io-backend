import * as t from "io-ts";
import { ulid } from "ulid";
import * as validator from "validator";

import { tag, Tagged } from "./types";

// a generator of identifiers
export type ObjectIdGenerator = () => NonEmptyString;

// tslint:disable-next-line:no-useless-cast
export const ulidGenerator: ObjectIdGenerator = () => ulid() as NonEmptyString;

/**
 * A non-empty string
 */

interface INonEmptyStringTag {
  readonly kind: "INonEmptyStringTag";
}

export const NonEmptyString = tag<INonEmptyStringTag>()(
  t.refinement(t.string, s => s.length > 0, "non empty string")
);

export type NonEmptyString = t.TypeOf<typeof NonEmptyString>;

/**
 * A string guaranteed to have a length within the range [L,H)
 */

interface IWithinRangeStringTag<L extends number, H extends number> {
  readonly lower: L;
  readonly higher: H;
  readonly kind: "IWithinRangeStringTag";
}

export const WithinRangeString = <
  L extends number,
  H extends number,
  T extends IWithinRangeStringTag<L, H>
>(
  l: L,
  h: H
  // tslint:disable-next-line:no-any
): Tagged<T, any, string> =>
  tag<T>()(
    t.refinement(
      t.string,
      s => s.length >= l && s.length < h,
      `string of length >= ${l} and < ${h}`
    )
  );

export type WithinRangeString<L extends number, H extends number> = string &
  IWithinRangeStringTag<L, H>;

/**
 * A string that matches a pattern.
 */

interface IPatternStringTag<P extends string> {
  readonly pattern: P;
  readonly kind: "IPatternStringTag";
}

export const PatternString = <P extends string, T extends IPatternStringTag<P>>(
  p: P
  // tslint:disable-next-line:no-any
): Tagged<T, any, string> =>
  tag<T>()(
    t.refinement(
      t.string,
      s => s.match(p) !== null,
      `string that matches the pattern "${p}"`
    )
  );

export type PatternString<P extends string> = string & IPatternStringTag<P>;

/**
 * A string that represents a valid email address.
 */

interface IEmailStringTag {
  readonly kind: "IEmailStringTag";
}

export const EmailString = tag<IEmailStringTag>()(
  t.refinement(
    t.string,
    s =>
      validator.isEmail(s, {
        allow_display_name: false,
        allow_utf8_local_part: false,
        require_tld: true
      }),
    "string that represents an email address"
  )
);

export type EmailString = t.TypeOf<typeof EmailString>;

/**
 * A string that represents an IP (v4 or v6).
 */

interface IIPStringTag {
  readonly kind: "IIPStringTag";
}

export const IPString = tag<IIPStringTag>()(
  t.refinement(t.string, validator.isIP, "string that represents an IP address")
);

export type IPString = t.TypeOf<typeof IPString>;

/**
 * A string that represents a valid CIDR.
 */

const v4 =
  "(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}\\/(3[0-2]|[12]?[0-9])";

const v6seg = "[0-9a-fA-F]{1,4}";
const v6 = `
(
(?:${v6seg}:){7}(?:${v6seg}|:)|                                // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8
(?:${v6seg}:){6}(?:${v4}|:${v6seg}|:)|                         // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4
(?:${v6seg}:){5}(?::${v4}|(:${v6seg}){1,2}|:)|                 // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4
(?:${v6seg}:){4}(?:(:${v6seg}){0,1}:${v4}|(:${v6seg}){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4
(?:${v6seg}:){3}(?:(:${v6seg}){0,2}:${v4}|(:${v6seg}){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4
(?:${v6seg}:){2}(?:(:${v6seg}){0,3}:${v4}|(:${v6seg}){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4
(?:${v6seg}:){1}(?:(:${v6seg}){0,4}:${v4}|(:${v6seg}){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4
(?::((?::${v6seg}){0,5}:${v4}|(?::${v6seg}){1,7}|:))           // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4
)(%[0-9a-zA-Z]{1,})?                                           // %eth0            %1
\\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])
`
  .replace(/\s*\/\/.*$/gm, "")
  .replace(/\n/g, "")
  .trim();

export const CIDR = PatternString(`(?:^${v4}$)|(?:^${v6}$)`);

export type CIDR = t.TypeOf<typeof CIDR>;
