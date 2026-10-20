import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { RegisterUserDto } from './dto/registerUser.dto.js';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from './dto/loginUser.dto.js';

describe('AuthService', () => {
  let service: AuthService;
  let repository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  }
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    repository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn()
    }

    jwtService = { signAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService,
        { provide: getRepositoryToken(User), useValue: repository },
        { provide: JwtService, useValue: jwtService }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      email: 'test@example.com',
      password: 'Password123!'
    } as unknown as RegisterUserDto;

    it('hashes the password, saves the user and returns only the id and email', async () => {
      repository.findOneBy.mockResolvedValue(null as never);

      repository.create.mockImplementation((data: unknown) => data);
      repository.save.mockResolvedValue({
        id: 1,
        email: dto.email,
        password: 'stored-hash'
      } as never);

      const res = await service.create(dto);

      expect(repository.findOneBy).toHaveBeenCalledWith({ email: dto.email });

      //The password handed to the db should be hashed
      const createArg = repository.create.mock.calls[0][0] as {
        email: string;
        password: string;
      };

      expect(createArg.email).toBe(dto.email);
      expect(createArg.password).not.toBe(dto.password);
      await expect(bcrypt.compare(dto.password, createArg.password)).resolves.toBe(true);

      expect(repository.save).toHaveBeenCalledWith(createArg);

      expect(res).toEqual({ id: 1, email: dto.email });
      expect(res).not.toHaveProperty('password');
    });

    it('throws ConflictException when the email is already registered', async () => {
      repository.findOneBy.mockResolvedValue({ id: 1, email: dto.email } as never);

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow('Email has been already registered');
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('propagates repository errors from save', async () => {
      repository.findOneBy.mockResolvedValue(null as never);
      repository.create.mockReturnValue({} as never);
      repository.save.mockRejectedValue(new Error('db error') as never);

      await expect(service.create(dto)).rejects.toThrow('db error');
    });
  });

  describe('login', () => {
    const plainPassword = 'Password123!';
    const dto = {
      email: 'test@example.com',
      password: plainPassword,
    } as unknown as LoginUserDto;
    let hashedPassword: string;

    beforeAll(async () => {
      // Bcrypt with a lower cost factor to keep the tests fast
      hashedPassword = await bcrypt.hash(plainPassword, 4);
    });

    it('returns a signed token for valid credentials', async () => {
      repository.findOneBy.mockResolvedValue({
        id: 1,
        email: dto.email,
        password: hashedPassword,
      } as never);

      jwtService.signAsync.mockResolvedValue('signedJwtToken' as never);

      const result = await service.login(dto);

      expect(repository.findOneBy).toHaveBeenCalledWith({ email: dto.email });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: dto.email,
      });
      expect(result).toBe('signedJwtToken');
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null as never);

      const promise = service.login(dto);

      await expect(promise).rejects.toThrow(UnauthorizedException);
      await expect(promise).rejects.toThrow('Invalid credentials!');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      repository.findOneBy.mockResolvedValue({
        id: 1,
        email: dto.email,
        password: hashedPassword,
      } as never);

      const promise = service.login({
        ...dto,
        password: 'WrongPassword!',
      } as unknown as LoginUserDto);

      await expect(promise).rejects.toThrow(UnauthorizedException);
      await expect(promise).rejects.toThrow('Invalid credentials!');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('propagates errors from the JWT service', async () => {
      repository.findOneBy.mockResolvedValue({
        id: 1,
        email: dto.email,
        password: hashedPassword,
      } as never);
      jwtService.signAsync.mockRejectedValue(new Error('sign error') as never);

      await expect(service.login(dto)).rejects.toThrow('sign error');
    });
  });
});
