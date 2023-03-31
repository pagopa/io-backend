import * as appInsights from "applicationinsights";
import { QueueClient, QueueSendMessageResponse } from "@azure/storage-queue";
import { RevokeAssertionRefInfo } from "@pagopa/io-functions-commons/dist/src/entities/revoke_assertion_ref_info";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { IO } from "fp-ts/lib/IO";
import { errorsToError } from "../utils/errorsFormatter";
import { AssertionRef } from "../../generated/lollipop-api/AssertionRef";
import { ActivatedPubKey } from "../../generated/lollipop-api/ActivatedPubKey";
import { AssertionTypeEnum } from "../../generated/lollipop-api/AssertionType";
import { base64EncodeObject } from "../utils/messages";
import { LollipopApiClient } from "../clients/lollipop";
import { sha256 } from "../utils/crypto";

const lollipopErrorEventName = "lollipop.error.acs";

export default class LollipopService {
  private readonly queueClient: QueueClient;

  constructor(
    private readonly lollipopFnClient: ReturnType<LollipopApiClient>,
    private readonly queueStorageConnectionString: string,
    private readonly queueName: string,
    private readonly appInsightsTelemetryClient?: appInsights.TelemetryClient
  ) {
    this.queueClient = new QueueClient(
      this.queueStorageConnectionString,
      this.queueName
    );
  }

  /**
   * Send a message into the Queue to schedule the pub key revoke process
   * on fn-lollipop.
   *
   * @param assertionRef the pub key identifier
   */
  public revokePreviousAssertionRef(
    assertionRef: AssertionRef
  ): Promise<QueueSendMessageResponse> {
    const revokeMessage = RevokeAssertionRefInfo.encode({
      assertion_ref: assertionRef
    });
    return this.queueClient.sendMessage(base64EncodeObject(revokeMessage));
  }

  /**
   * Update the pub key status to VALIDATED into the fn-lollipop
   * when the login process is completed.
   *
   * @param assertionRef the pub key identifier
   * @param fiscalCode the user fiscal code
   * @param assertion the SAML assertion related the login process
   */
  public activateLolliPoPKey(
    assertionRef: AssertionRef,
    fiscalCode: FiscalCode,
    assertion: NonEmptyString,
    getExpirePubKeyFn: IO<Date>
  ): TE.TaskEither<Error, ActivatedPubKey> {
    return pipe(
      TE.tryCatch(
        () =>
          this.lollipopFnClient.activatePubKey({
            assertion_ref: assertionRef,
            body: {
              assertion,
              assertion_type: AssertionTypeEnum.SAML,
              expired_at: getExpirePubKeyFn(),
              fiscal_code: fiscalCode
            }
          }),
        e => {
          const error = E.toError(e);
          this.appInsightsTelemetryClient?.trackEvent({
            name: lollipopErrorEventName,
            properties: {
              assertion_ref: assertionRef,
              fiscal_code: sha256(fiscalCode),
              message: `Error activating lollipop pub key | ${error.message}`
            }
          });
          return error;
        }
      ),
      TE.chain(
        flow(
          TE.fromEither,
          TE.mapLeft(errors => {
            const error = errorsToError(errors);
            this.appInsightsTelemetryClient?.trackEvent({
              name: lollipopErrorEventName,
              properties: {
                assertion_ref: assertionRef,
                fiscal_code: sha256(fiscalCode),
                message: `Error activating lollipop pub key | ${error.message}`
              }
            });
            return error;
          })
        )
      ),
      TE.chain(
        TE.fromPredicate(
          (res): res is IResponseType<200, ActivatedPubKey, never> =>
            res.status === 200,
          () =>
            new Error(
              "Error calling the function lollipop api for pubkey activation"
            )
        )
      ),
      TE.map(res => res.value)
    );
  }
}
