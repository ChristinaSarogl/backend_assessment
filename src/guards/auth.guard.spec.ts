import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: {verify: jest.Mock };

  //Create test context
  const createContext = (headers: Record<string, unknown> = {}) => {
    const request: Record<string,any> = {headers};
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      })
    } as unknown as ExecutionContext;

    return {context, request};
  }

  beforeEach(async () => {
    jwtService = { verify: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthGuard,
        {provide: JwtService, useValue: jwtService}
      ]
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);

    //Log guard verification errors
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  })

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('missing authorization header', () => {
    it('throws UnauthorizedException when the header is missing', () => {
      const {context} = createContext({});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Missing authorization header');
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the header is not a string', () => {
      const {context} = createContext({ authorization: ['Bearer abc']});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Missing authorization header');
      expect(jwtService.verify).not.toHaveBeenCalled();
    });
  });

  describe('malformed authorization header', () => {
    it.each([
      ['empty string', ''],
      ['token only', 'token'],
      ['wrong scheme', 'Basic token'],
      ['lowercase scheme', 'bearer token'],
      ['scheme without token', 'Bearer'],
      ['scheme with empty token', 'Bearer '],
      ['too many parts', 'Bearer token extra'],
    ])('throws for %s', (_label, header) => {
      const {context} = createContext({ authorization: header});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid authorization header');
      expect(jwtService.verify).not.toHaveBeenCalled();
    });
  });

  describe('token verification', () => {
    it('throws UnauthorizedException when verification fails', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Expired token');
      });

      const { context, request } = createContext({ authorization: 'Bearer expiredToken'});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('An error occured during authorization verification.');
      expect(request.user).toBeUndefined();
    });

    it('returns true and attach decoded payload to request.user', () => {
      const payload = { sub:'jest-user', email: 'test@email.com'};
      jwtService.verify.mockReturnValue(payload);

      const { context, request } = createContext({ authorization: 'Bearer validToken'});

      const res = guard.canActivate(context);

      expect(res).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledTimes(1);
      expect(jwtService.verify).toHaveBeenCalledWith('validToken');
      expect(request.user).toEqual(payload);
    });
  });
});
