/**
 * This file adds a wrapper to the PaymentData to allow runtime
 * validation.
 */
import * as t from "io-ts";
import { PaymentAmount } from "../api/PaymentAmount";
import { PaymentNoticeNumber } from "../api/PaymentNoticeNumber";

/**
 * Metadata needed to process pagoPA payments.
 */

// required attributes
const PaymentDataR = t.interface({
  amount: PaymentAmount,
  noticeNumber: PaymentNoticeNumber
});

// optional attributes
const PaymentDataO = t.partial({});

export const PaymentData = t.intersection(
  [PaymentDataR, PaymentDataO],
  "PaymentData"
);

export type PaymentData = t.TypeOf<typeof PaymentData>;
