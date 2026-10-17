import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class StreamingService {
    constructor(
        @InjectRepository(Movie)
        private moviesRepository: Repository<Movie>,
    ) { }

    findAll(): Promise<Movie[]> {
        return this.moviesRepository.find();
    }

    findOne(id: number): Promise<Movie | null> {
        return this.moviesRepository.findOneBy({ id });
    }

    async remove(id: number): Promise<void> {
        await this.moviesRepository.delete(id);
    }
}
