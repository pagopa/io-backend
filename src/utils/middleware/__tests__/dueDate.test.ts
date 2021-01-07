import { dueDateMiddleware } from "../dueDate";
import * as request from "supertest";
import * as express from "express";

const currentDate = new Date();
const RealDate = Date;
// @ts-ignore override Date constructor to have fixed date
Date = function(...options): Date {
  if (options.length) {
    return new RealDate(...options);
  }

  return currentDate;
};
Date.now = () => currentDate.getTime();

const aPastDate = new Date(currentDate.getTime() - 1);
const aFutureDate = new Date(currentDate.getTime() + 1);

const mockHandlerStatusCode = 200;
const mockHandler = jest.fn((_, res) => {
  res.status(mockHandlerStatusCode).send();
});

describe("dueDateMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should block the operation if the due date is past", async () => {
    const app = express();
    app.use(dueDateMiddleware(aPastDate));
    app.get("/test", mockHandler);

    await request(app)
      .get("/test")
      .expect(404);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it("should execute the operation if the date is future", async () => {
    const app = express();
    app.use(dueDateMiddleware(aFutureDate));
    app.get("/test", mockHandler);

    await request(app)
      .get("/test")
      .expect(mockHandlerStatusCode);
    expect(mockHandler).toHaveBeenCalled();
  });

  it("should execute the operation if the date is the very same millisecond", async () => {
    const app = express();
    app.use(dueDateMiddleware(currentDate));
    app.get("/test", mockHandler);

    await request(app)
      .get("/test")
      .expect(mockHandlerStatusCode);
    expect(mockHandler).toHaveBeenCalled();
  });
});
