import { Module } from '@nestjs/common';
import { StreamingController } from './streaming.controller.js';
import { StreamingService } from './streaming.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Movie])],
  controllers: [StreamingController],
  providers: [StreamingService]
})
export class StreamingModule {}
