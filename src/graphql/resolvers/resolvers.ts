/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable sort-keys */
import { GraphQLScalarType } from "graphql";
import { UserInputError } from "apollo-server-express";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

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

const users = [
  {
    id: "AAABBB00C00D000E",
    name: "John Doe"
  },
  {
    id: "AAABBB01C00D000E",
    name: "Jane Doe"
  }
];

const messages = [
  {
    id: "1",
    text: "Hello World 1",
    userId: "AAABBB00C00D000E"
  },
  {
    id: "2",
    text: "Hello World 2",
    userId: "AAABBB00C00D000E"
  },
  {
    id: "3",
    text: "Hello World 3",
    userId: "AAABBB00C00D000E"
  },
  {
    id: "4",
    text: "Hello World 1",
    userId: "AAABBB01C00D000E"
  },
  {
    id: "5",
    text: "Hello World 2",
    userId: "AAABBB01C00D000E"
  }
];

// Provide resolver functions for your schema fields
export const resolvers = {
  FiscalCode: fiscalCodeScalar,
  Query: {
    // @ts-ignore
    user: (parent, args, context, info) => {
      // @ts-ignore
      console.log(
        JSON.stringify(
          // @ts-ignore
          info.fieldNodes[0].selectionSet.selections.map(x => x.name.value)
        )
      );
      const fiscalCode = args.id;
      return users.filter(x => x.id === fiscalCode)[0];
    }
  },
  User: {
    // @ts-ignore
    messages: parent => {
      const userId = parent.id;
      console.log(userId);
      return messages.filter(message => message.userId === userId);
    }
  }
};
