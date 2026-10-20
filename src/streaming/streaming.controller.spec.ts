import { Test, TestingModule } from '@nestjs/testing';
import { StreamingController } from './streaming.controller.js';
import { jest } from '@jest/globals';
import { StreamingService } from './streaming.service.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateMovieDTO } from './dto/createMovie.dto.js';
import { UpdateMovieDTO } from './dto/updateMovie.dto.js';

describe('StreamingController', () => {
  let controller: StreamingController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  }

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamingController],
      providers: [{ provide: StreamingService, useValue: service }]
    }).overrideGuard(AuthGuard).useValue({ canActivate: () => true }).compile();

    controller = module.get<StreamingController>(StreamingController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  })

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('calls the service and returns its result', async () => {
      const paged = { data: [], meta: { total: 0 } };
      service.findAll.mockResolvedValue(paged as never);

      const res = await controller.findAll(2, 10, 'Drama');

      expect(service.findAll).toHaveBeenCalledWith(2, 10, 'Drama');
      expect(res).toBe(paged);
    });

    it.each([0, -1, -100])('reject page %i', async (page) => {
      await expect(controller.findAll(page, 20, '')).rejects.toThrow(BadRequestException);
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it.each([0, -1, 101])('reject limit %i', async (limit) => {
      await expect(controller.findAll(1, limit, '')).rejects.toThrow(BadRequestException);
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it.each([1, 100])('accept the boundary limit %s', async (limit) => {
      const paged = { data: [], meta: {} };

      await controller.findAll(1, limit, '');

      expect(service.findAll).toHaveBeenCalledWith(1, limit, '');
    });

    it('propagates repository errors', async () => {
      service.findAll.mockRejectedValue(new Error('db error') as never);

      await expect(service.findAll(1, 20, '')).rejects.toThrow('db error');
    });
  });

  describe('findOne', () => {
    it('returns the movie when found', async () => {
      const movie = { id: 1, title: 'Heat' };
      service.findOne.mockResolvedValue(movie as never);

      await expect(controller.findOne(1)).resolves.toBe(movie);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException if the id does not exist ', async () => {
      service.findOne.mockResolvedValue(null as never);

      expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
      expect(controller.findOne(99)).rejects.toThrow('Entry with ID 99 not found!');
    });
  });

  describe('create', () => {
    it('passed the DTO to the service and returns the created movie', async () => {
      const dto = { title: 'Heat', genre: 'Crime' } as unknown as CreateMovieDTO;
      const created = { id: 1, ...dto };
      service.create.mockResolvedValue(created as never);

      await expect(controller.create(dto)).resolves.toBe(created);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('passed the id and DTO to the service and returns the updated movie', async () => {
      const dto = { title: 'New title'} as unknown as UpdateMovieDTO;
      const updated = { id:1, title: 'New title'};
      service.update.mockResolvedValue(updated as never);

      await expect(controller.update(1, dto)).resolves.toBe(updated);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });

    it('propagates NotFoundException error from the service', async () => {
      service.update.mockRejectedValue(new NotFoundException() as never);
 
      await expect(
        controller.update(99, {} as unknown as UpdateMovieDTO),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('call service.remove with the id', async () => {
      service.remove.mockResolvedValue(undefined as never);

      await expect(controller.delete(1)).resolves.toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('propagates NotFoundException error from the service', async () => {
      service.remove.mockRejectedValue(new NotFoundException() as never);
 
      await expect(controller.delete(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('streamMovie', () => {
    it('returns the video url of the movie', async () => {
      const movie = {
        id: 1,
        title: 'Heat',
        video_url: 'https://cdn.example.com/heat.mp4',
      };
      service.findOne.mockResolvedValue(movie as never);
 
      const result = await controller.streamMovie(1);
 
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe('https://cdn.example.com/heat.mp4');
    });
 
    it('throws NotFoundException when the movie does not exist', async () => {
      service.findOne.mockResolvedValue(null as never);
 
      const promise = controller.streamMovie(99);
 
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Entry with ID 99 not found!');
    });
 
    it('propagates service errors', async () => {
      service.findOne.mockRejectedValue(new Error('db error') as never);
 
      await expect(controller.streamMovie(1)).rejects.toThrow('db error');
    });
  });
});
