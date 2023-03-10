import * as express from "express";
import { toExpressHandler } from "../utils/express";
import { lollipopMiddleware } from "../utils/middleware/lollipop";
import { firstLollipopSign } from "../controllers/firstLollipopConsumerController";
import * as request from "supertest";
import { LollipopApiClient } from "../clients/lollipop";
import { anAssertionRef } from "../__mocks__/lollipop";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { ISessionStorage } from "../services/ISessionStorage";
import { FirstLollipopConsumerClient } from "../clients/firstLollipopConsumer";
import * as bodyParser from "body-parser";
import { aFiscalCode, mockedUser } from "../__mocks__/user_mock";
import { AssertionTypeEnum } from "../../generated/lollipop-api/AssertionType";
import { PubKeyStatusEnum } from "../../generated/lollipop-api/PubKeyStatus";
import * as http from "http";
import nodeFetch from "node-fetch";

const basePath = "/api/v1";

const mockGenerateLCParams = jest.fn();
const mockClient = {
  generateLCParams: mockGenerateLCParams,
  activatePubKey: jest.fn(),
  ping: jest.fn(),
  reservePubKey: jest.fn()
} as ReturnType<typeof LollipopApiClient>;

const mockGetlollipopAssertionRefForUser = jest
  .fn()
  .mockImplementation(async () => {
    console.log("ho chiamato mockGetlollipopAssertionRefForUser");
    return E.right(O.some(anAssertionRef));
  });
const mockSessionStorage = ({
  getLollipopAssertionRefForUser: mockGetlollipopAssertionRefForUser
} as unknown) as ISessionStorage;

const aBearerToken = "aBearerTokenJWT";
const aPubKey = "aPubKey";

const port = 7001;
const mockFetch = jest
  .fn()
  .mockImplementation((...args) => (nodeFetch as any)(...args));
export const FIRST_LOLLIPOP_CONSUMER_CLIENT = FirstLollipopConsumerClient(
  "anApiKey",
  `http://localhost:${port}/api/v1/first-lollipop-consumer`,
  "",
  mockFetch
);

const lollipopConsumerApp = express();
lollipopConsumerApp.use(
  bodyParser.json({
    verify: (_req, res: express.Response, buf, _encoding: BufferEncoding) => {
      // eslint-disable-next-line functional/immutable-data
      res.locals.body = buf;
    }
  })
);
const mockLCMiddleware = jest
  .fn()
  .mockImplementation((req: express.Request, res) => {
    res.status(200).json({
      response: req.body["message"]
    });
  });
const expectedLollipopLCPath = "/api/v1/first-lollipop-consumer/signed-message";
lollipopConsumerApp.post(
  "/api/v1/first-lollipop-consumer/signed-message",
  mockLCMiddleware
);
const server = http.createServer(lollipopConsumerApp);

describe("lollipopSign", () => {
  beforeAll(async () => {
    await new Promise(resolve => {
      server.listen(port, () => {
        resolve(void 0);
      });
    });
  });
  afterAll(async () => {
    jest.clearAllMocks();
    await new Promise(resolve => server.close(() => resolve(void 0)));
  });
  it("should returns a status 200 response on lollipop consumer mocked impl", async () => {
    mockGenerateLCParams.mockResolvedValueOnce(
      E.right({
        status: 200,
        value: {
          fiscal_code: aFiscalCode,
          assertion_file_name: `${aFiscalCode}-${anAssertionRef}`,
          assertion_type: AssertionTypeEnum.SAML,
          expired_at: Date.now(),
          lc_authentication_bearer: aBearerToken,
          assertion_ref: anAssertionRef,
          pub_key: aPubKey,
          version: 1,
          status: PubKeyStatusEnum.VALID,
          ttl: 900
        }
      })
    );
    mockGetlollipopAssertionRefForUser.mockResolvedValue(
      E.right(O.some(anAssertionRef))
    );
    // Generate a mocked express App;
    const app = express();
    // Initialize the custom body parser
    app.use(
      bodyParser.json({
        verify: (
          _req,
          res: express.Response,
          buf,
          _encoding: BufferEncoding
        ) => {
          // eslint-disable-next-line functional/immutable-data
          res.locals.body = buf;
        }
      })
    );
    // Mock the Api call for signing whithout the auth middleware
    app.post(
      `${basePath}/sign`,
      (req, _, next) => {
        req.user = mockedUser;
        next();
      },
      lollipopMiddleware(mockClient, mockSessionStorage),
      toExpressHandler(firstLollipopSign(FIRST_LOLLIPOP_CONSUMER_CLIENT))
    );

    const lollipopRequestHeaders = {
      signature: `sig1=:hNojB+wWw4A7SYF3qK1S01Y4UP5i2JZFYa2WOlMB4Np5iWmJSO0bDe2hrYRbcIWqVAFjuuCBRsB7lYQJkzbb6g==:`,
      ["signature-input"]: `sig1=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url"); created=1618884475; keyid="test-key-rsa-pss"`,
      ["x-pagopa-lollipop-original-method"]: "POST",
      ["x-pagopa-lollipop-original-url"]: "https://api.pagopa.it"
    };

    const expectedRequestBody = { message: "aMessage" };

    await request(app)
      .post(`${basePath}/sign`)
      .send(expectedRequestBody)
      .set("signature", lollipopRequestHeaders.signature)
      .set("signature-input", lollipopRequestHeaders["signature-input"])
      .set(
        "x-pagopa-lollipop-original-method",
        lollipopRequestHeaders["x-pagopa-lollipop-original-method"]
      )
      .set(
        "x-pagopa-lollipop-original-url",
        lollipopRequestHeaders["x-pagopa-lollipop-original-url"]
      )
      .expect(200);
    expect(mockLCMiddleware).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      `http://localhost:${port}${expectedLollipopLCPath}`,
      expect.objectContaining({
        body: expect.any(Buffer)
      })
    );
  });
});
