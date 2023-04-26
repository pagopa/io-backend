import * as express from "express";
import { toExpressHandler } from "../utils/express";
import { expressLollipopMiddleware } from "../utils/middleware/lollipop";
import { firstLollipopSign } from "../controllers/firstLollipopConsumerController";
import * as request from "supertest";
import { LollipopApiClient } from "../clients/lollipop";
import {
  aLollipopOriginalMethod,
  aLollipopOriginalUrl,
  anAssertionRef,
  aSignature,
  aSignatureInput
} from "../__mocks__/lollipop";
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
      expressLollipopMiddleware(mockClient, mockSessionStorage),
      toExpressHandler(firstLollipopSign(FIRST_LOLLIPOP_CONSUMER_CLIENT))
    );

    const lollipopRequestHeaders = {
      signature: aSignature,
      ["signature-input"]: aSignatureInput,
      ["x-pagopa-lollipop-original-method"]: aLollipopOriginalMethod,
      ["x-pagopa-lollipop-original-url"]: aLollipopOriginalUrl,
      "content-digest": "sha-256=:cpyRqJ1VhoVC+MSs9fq4/4wXs4c46EyEFriskys43Zw=:"
    };

    const expectedRequestBody = { message: "aMessage" };

    await request(app)
      .post(`${basePath}/sign`)
      .send(expectedRequestBody)
      .set(lollipopRequestHeaders)
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
