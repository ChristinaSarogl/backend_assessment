import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity.js';
import { Repository } from 'typeorm';

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

    async remove(id: number): Promise<void> {
        await this.moviesRepository.delete(id);
    }
}
