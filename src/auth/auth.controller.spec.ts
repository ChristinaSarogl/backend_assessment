import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { jest } from '@jest/globals';
import { AuthService } from './auth.service.js';
import { LoginUserDto } from './dto/loginUser.dto.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/registerUser.dto.js';
import { UserRole } from './entities/user.entity.js';

describe('AuthController', () => {
  let controller: AuthController;
  let service: {
    login: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      login: jest.fn(),
      create: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const dto = {
      email: 'test@example.com',
      password: 'Password123!',
    } as unknown as LoginUserDto;
 
    it('passes the DTO to the service and returns its result', async () => {
      service.login.mockResolvedValue('signedJwtToken' as never);
 
      await expect(controller.login(dto)).resolves.toBe('signedJwtToken');
      expect(service.login).toHaveBeenCalledWith(dto);
    });
 
    it('propagates UnauthorizedException from the service', async () => {
      service.login.mockRejectedValue(new UnauthorizedException() as never);
 
      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('create', () => {
    const dto = {
      email: 'test@example.com',
      password: 'Password123!',
    } as unknown as RegisterUserDto;
 
    it('passes the DTO to the service and returns the created user', async () => {
      const created = { id: 1, email: dto.email };
      service.create.mockResolvedValue(created as never);
 
      await expect(controller.create(dto)).resolves.toBe(created);
      expect(service.create).toHaveBeenCalledWith(dto, UserRole.USER);
    });
 
    it('propagates ConflictException from the service', async () => {
      service.create.mockRejectedValue(new ConflictException() as never);
 
      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('createAdmin', () => {
    const dto = {
      email: 'test@example.com',
      password: 'Password123!',
    } as unknown as RegisterUserDto;
 
    it('passes the DTO to the service and returns the created user', async () => {
      const created = { id: 2, email: dto.email };
      service.create.mockResolvedValue(created as never);
 
      await expect(controller.createAdmin(dto)).resolves.toBe(created);
      expect(service.create).toHaveBeenCalledWith(dto, UserRole.ADMIN);
    });
 
    it('propagates ConflictException from the service', async () => {
      service.create.mockRejectedValue(new ConflictException() as never);
 
      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
