import { Test, TestingModule } from '@nestjs/testing';
import { StreamingService } from './streaming.service.js';
import { jest } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity.js';
import { CreateMovieDTO } from './dto/createMovie.dto.js';
import { UpdateMovieDTO } from './dto/updateMovie.dto.js';
import { NotFoundException } from '@nestjs/common';

describe('StreamingService', () => {
  let service: StreamingService;
  let repository: {
    findAndCount: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  }

  const movie = { id: 1, title: 'Heat', description: 'Description', genre: 'Crime' } as unknown as Movie;

  beforeEach(async () => {
    repository = {
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [StreamingService,
        { provide: getRepositoryToken(Movie), useValue: repository }
      ],
    }).compile();

    service = module.get<StreamingService>(StreamingService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('uses default values when called without arguments', async () => {
      repository.findAndCount.mockResolvedValue([[movie], 1] as never);

      await service.findAll();

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        order: { id: 'ASC' }
      });
    });

    it('filters by genre when one is provided', async () => {
      repository.findAndCount.mockResolvedValue([[movie], 1] as never);

      await service.findAll(1, 20, 'Crime');

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { genre: 'Crime' } })
      );
    });

    it('treats an genre empty string as no filter', async () => {
      repository.findAndCount.mockResolvedValue([[movie], 1] as never);

      await service.findAll(1, 20, '');

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('calculates skip and take from page and limit', async () => {
      repository.findAndCount.mockResolvedValue([[], 0] as never);

      await service.findAll(3, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
    });

    it('returns the middle page with the correct metadata', async () => {
      const movies = [movie, { ...movie, id: 2 } as Movie];

      repository.findAndCount.mockResolvedValue([movies, 45] as never);

      const res = await service.findAll(2, 20);

      expect(res).toEqual({
        data: movies,
        meta: {
          total: 45,
          page: 2,
          limit: 20,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      });
    });

    it('reports no next page when on last page', async () => {
      repository.findAndCount.mockResolvedValue([[movie], 45] as never);

      const res = await service.findAll(3, 20);

      expect(res.meta.hasNextPage).toBe(false);
      expect(res.meta.hasPreviousPage).toBe(true);
    });

    it('reports no next page when the total is an exact multiple of the limit', async () => {
      repository.findAndCount.mockResolvedValue([[movie], 40] as never);

      const res = await service.findAll(2, 20);

      expect(res.meta.totalPages).toBe(2);
      expect(res.meta.hasNextPage).toBe(false);
    });

    it('handles an empty result set', async () => {
      repository.findAndCount.mockResolvedValue([[], 0] as never);

      const res = await service.findAll(1, 20);

      expect(res.data).toEqual([]);
      expect(res.meta).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('findOne', () => {
    it('returns the movie when the id exists', async () => {
      repository.findOneBy.mockResolvedValue(movie as never);

      await expect(service.findOne(1)).resolves.toBe(movie);

      expect(repository.findOneBy).toHaveBeenCalledWith({id: 1});
    });

    it('returns null when the id exists', async () => {
      repository.findOneBy.mockResolvedValue(null as never);

      await expect(service.findOne(99)).resolves.toBeNull();
    });
  });

  describe('create', () => {
    it('creates an entity from the DTO, saves it and returns the saved movie', async () => {
      const dto = {title: 'Heat', description: 'Description', genre: 'Crime'} as unknown as CreateMovieDTO;
      const entity = {...dto} as unknown as Movie;

      repository.create.mockReturnValue(entity);
      repository.save.mockResolvedValue(movie as never);

      const res = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(entity);
      expect(res).toBe(movie);
    });

    it('propagates repository errors', async () => {
      repository.create.mockReturnValue({});
      repository.save.mockRejectedValue(new Error('db error') as never);

      await expect(
        service.create({} as unknown as CreateMovieDTO)
      ).rejects.toThrow('db error');
    });
  });

  describe('update', () => {
    it('merges the DTO into the existing movie and saves it ', async () => {
      const existing = {id: 1, title: 'Heat', description: 'Description', genre: 'Crime'} as unknown as Movie;
      const dto = {title: 'Heat (Directors Cut)'} as unknown as UpdateMovieDTO;
      repository.findOneBy.mockResolvedValue(existing as never);
      repository.save.mockImplementation(async (m) => m);

      const res = await service.update(1, dto);

      expect(repository.findOneBy).toHaveBeenCalledWith({id:1});
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          title: 'Heat (Directors Cut)',
          genre: 'Crime'
        })
      );

      expect(res).toMatchObject({id: 1, title: 'Heat (Directors Cut)'});
    });

    it('throws NotFoundException if the id does not exist ', async () => {
      repository.findOneBy.mockResolvedValue(null as never);

      await expect(
        service.update(99, {} as unknown as UpdateMovieDTO)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update(99, {} as unknown as UpdateMovieDTO)
      ).rejects.toThrow('Entry with ID 99 not found.');
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the movie by id ', async () => {
      repository.delete.mockResolvedValue({ affected: 1} as never);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException if the id does not exist ', async () => {
      repository.delete.mockResolvedValue({ affected: 0} as never);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
      await expect(service.remove(99)).rejects.toThrow('Entry with ID 99 not found.');
    });
  });
});