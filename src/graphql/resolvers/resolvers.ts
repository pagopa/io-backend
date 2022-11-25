/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable sort-keys */
import { GraphQLError, GraphQLScalarType } from "graphql";
import { UserInputError } from "apollo-server-express";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";

import {
  Maybe,
  Message,
  MessageContent,
  Resolvers,
  Service
} from "generated/graphql/types";
import { User } from "src/types/user";
import NewMessagesService from "src/services/newMessagesService";
import FunctionsAppService from "src/services/functionAppService";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";

export interface ContextWithUser {
  readonly user: User;
  readonly messageService: NewMessagesService;
  readonly fnAppMessageService: FunctionsAppService;
}

// export interface ContextFunctionParams {}

const fiscalCodeScalar = new GraphQLScalarType<FiscalCode>({
  name: "FiscalCode",
  description: "Fiscal code from io-ts",
  serialize(value) {
    return pipe(
      value,
      FiscalCode.decode,
      E.getOrElseW(() => {
        throw new UserInputError("not a valid fiscal code");
      })
    );
  },
  parseValue(value) {
    return pipe(
      value,
      FiscalCode.decode,
      E.getOrElseW(() => {
        throw new UserInputError("not a valid fiscal code");
      })
    );
  },
  parseLiteral(value) {
    return pipe(
      value,
      FiscalCode.decode,
      E.getOrElseW(() => {
        throw new UserInputError("not a valid fiscal code");
      })
    );
  }
});

// Provide resolver functions for your schema fields
export const resolvers: Resolvers<ContextWithUser> = {
  FiscalCode: fiscalCodeScalar,

  // TODO
  // ServiceMetadata: {
  //   __resolveType: (obj, _context, _info) => {
  //     return obj.category === ServiceMetadataCategoryEnum.Standard
  //       ? "StandardServiceMetadata"
  //       : "SpecialServiceMetadata";
  //   }
  // },

  Service: {
    service_metadata: parent => ({
      ...parent.service_metadata,
      __typename: "StandardServiceMetadata"
    })
  },

  Message: {
    content: (parent, _args, context, _info) => {
      // eslint-disable-next-line sonarjs/prefer-immediate-return
      const p = pipe(
        TE.tryCatch(
          () =>
            context.messageService.getMessage(
              context.user,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { id: (parent as any).id }
            ),
          _ => "Error query services service"
        ),
        TE.chain(r =>
          r.kind === "IResponseSuccessJson"
            ? TE.of({
                content: r.value.content.markdown,
                subject: r.value.content.subject
              })
            : TE.left(`Error from message service: ${r.detail}`)
        ),
        T.map(_ => {
          if (E.isLeft(_)) {
            throw new GraphQLError(_.left);
          }
          return _.right as MessageContent;
        })
      )();

      return p;
    },
    service: (parent, _args, context, _info) => {
      // eslint-disable-next-line sonarjs/prefer-immediate-return
      const p = pipe(
        TE.tryCatch(
          () =>
            context.fnAppMessageService.getService(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (parent as any).sender_service_id
            ),
          _ => "Error query services service"
        ),
        TE.chain(r =>
          r.kind === "IResponseSuccessJson"
            ? TE.of(r.value)
            : TE.left(`Error from message service: ${r.detail}`)
        ),
        T.map(_ => {
          if (E.isLeft(_)) {
            throw new GraphQLError(_.left);
          }
          return _.right as Service;
        })
      )();

      return p;
    }
  },

  Query: {
    messages: (_parent, _args, context, _info) => {
      // eslint-disable-next-line sonarjs/prefer-immediate-return
      const p = pipe(
        TE.tryCatch(
          () =>
            context.messageService.getMessagesByUser(context.user, {
              pageSize: _args.pageSize as NonNegativeInteger,
              maximumId: _args.maximumId
                ? (_args.maximumId as NonEmptyString)
                : undefined,
              minimumId: _args.minimumId
                ? (_args.minimumId as NonEmptyString)
                : undefined,
              getArchivedMessages: false,
              enrichResultData: false
            }),
          _ => "Error query message service"
        ),
        TE.chain(r =>
          r.kind === "IResponseSuccessJson"
            ? TE.of(
                r.value.items.map(i => ({
                  id: i.id,
                  sender_service_id: i.sender_service_id
                }))
              )
            : TE.left(`Error from message service: ${r.detail}`)
        ),
        TE.getOrElseW(_ => {
          throw new GraphQLError(_);
        }),
        // eslint-disable-next-line functional/prefer-readonly-type
        T.map(_ => _ as Maybe<Array<Maybe<Message>>>)
      )();

      return p;
    }
  }
};
