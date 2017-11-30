// @flow

"use strict";

export type User = {
  +created_at: number,
  +token: string,
  +spid_idp: string,
  +fiscal_code: string,
  +name: string,
  +familyname: string,
  +spidcode?: string,
  +gender?: string,
  +mobilephone?: string,
  +email?: string,
  +address?: string,
  +expirationdate?: string,
  +digitaladdress?: string,
  +countyofbirth?: string,
  +dateofbirth?: string,
  +idcard?: string,
  +placeofbirth?: string
};
