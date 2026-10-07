import { LoggerMiddleware } from './logger.middleware';
import { Request, Response } from 'express';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should log request method and originalUrl, and call next()', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const mockReq = {
      method: 'GET',
      originalUrl: '/api/products',
    } as Request;

    const mockRes = {} as Response;
    const next = jest.fn();

    middleware.use(mockReq, mockRes, next);

    expect(consoleSpy).toHaveBeenCalledWith('GET');
    expect(consoleSpy).toHaveBeenCalledWith('/api/products');
    expect(next).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
