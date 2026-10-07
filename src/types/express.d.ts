import { accessToken, payloadTypes } from '../utils/payload';

declare global {
  namespace Express {
    interface Request {
      user: payloadTypes;
    }
  }
}
