import { User } from "../../types/user";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
