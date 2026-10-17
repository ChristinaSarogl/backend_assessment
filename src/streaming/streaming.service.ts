import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity.js';
import { Repository } from 'typeorm';
import { CreateMovieDTO } from './dto/createMovie.dto.js';
import { UpdateMovieDTO } from './dto/updateMovie.dto.js';

interface findAllRes {
    data: Movie[],
    meta: {
        total: number,
        page: number,
        limit: number,
        totalPages: number,
        hasNextPage: boolean,
        hasPreviousPage: boolean
    }
}

@Injectable()
export class StreamingService {
    constructor(
        @InjectRepository(Movie)
        private moviesRepository: Repository<Movie>,
    ) { }

    async findAll(page: number = 1, limit: number = 20): Promise<findAllRes> {
        const [movies, total] = await this.moviesRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: {
                id: 'ASC'
            }
        });

        return {
            data: movies,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findOne(id: number): Promise<Movie | null> {
        return this.moviesRepository.findOneBy({ id });
    }

    async create(createMovieDto: CreateMovieDTO): Promise<Movie> {
        const movie = this.moviesRepository.create(createMovieDto);

        return this.moviesRepository.save(movie);
    }

    async update(id: number, updateMovieDto: UpdateMovieDTO): Promise<Movie> {
        const movie = await this.moviesRepository.findOneBy({ id });

        if (!movie) {
            throw new NotFoundException(`Entry with ID ${id} not found.`);
        }

        Object.assign(movie, updateMovieDto);
        return this.moviesRepository.save(movie);
    }

    async remove(id: number): Promise<void> {
        console.log(id);
        const res = await this.moviesRepository.delete(id);

        if (res.affected === 0) {
            throw new NotFoundException(`Entry with ID ${id} not found.`);
        }
    }
}
