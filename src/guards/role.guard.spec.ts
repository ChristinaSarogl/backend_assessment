import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from './role.guard.js';
import { UserRole } from '../auth/entities/user.entity.js';
import { ROLES_KEY } from './role.decorator.js';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const [roleA, roleB] = Object.values(UserRole) as UserRole[];

  const handler = () => undefined;
  class TestController { }

  // Builds a fake ExecutionContext with the given handler, class and request user
  const createContext = (
    user?: unknown,
    contextHandler: (...args: any[]) => any = handler,
    contextClass: new (...args: any[]) => any = TestController,
  ) => {
    const request: Record<string, unknown> = { user };
    const context = {
      getHandler: () => contextHandler,
      getClass: () => contextClass,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  describe('with a mocked Reflector', () => {
    beforeEach(async () => {
      reflector = { getAllAndOverride: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RoleGuard,
          { provide: Reflector, useValue: reflector },
        ],
      }).compile();

      guard = module.get<RoleGuard>(RoleGuard);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('reads the roles metadata from the handler and the class', () => {
      reflector.getAllAndOverride.mockReturnValue([roleA] as never);
      const { context } = createContext({ role: roleA });

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        handler,
        TestController,
      ]);
    });

    describe('no roles configured', () => {
      it.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty array', []],
      ])('throws ForbiddenException when the metadata is %s', (_label, roles) => {
        reflector.getAllAndOverride.mockReturnValue(roles as never);
        const { context } = createContext({ role: roleA });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'No roles configured for this route',
        );
      });
    });

    describe('no user on the request', () => {
      it('throws ForbiddenException when request.user is missing', () => {
        reflector.getAllAndOverride.mockReturnValue([roleA] as never);
        const { context } = createContext(undefined);

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow('No user found!');
      });
    });

    describe('role check', () => {
      it('returns true when the user has the allowed role', () => {
        reflector.getAllAndOverride.mockReturnValue([roleA] as never);
        const { context } = createContext({ sub: 1, role: roleA });

        expect(guard.canActivate(context)).toBe(true);
      });

      it('returns true when the user has one of several allowed roles', () => {
        reflector.getAllAndOverride.mockReturnValue([roleA, roleB] as never);
        const { context } = createContext({ sub: 1, role: roleB });

        expect(guard.canActivate(context)).toBe(true);
      });

      it('throws ForbiddenException when the user has a different role', () => {
        reflector.getAllAndOverride.mockReturnValue([roleA] as never);
        const { context } = createContext({ sub: 1, role: roleB });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'Only administrators have access to this functionality.',
        );
      });

      it('throws ForbiddenException when the user has no role', () => {
        reflector.getAllAndOverride.mockReturnValue([roleA] as never);
        const { context } = createContext({ sub: 1 });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });

      it('throws ForbiddenException when the role is not a known value', () => {
        reflector.getAllAndOverride.mockReturnValue([roleA] as never);
        const { context } = createContext({ sub: 1, role: 'superuser' });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });
    });
  });
});