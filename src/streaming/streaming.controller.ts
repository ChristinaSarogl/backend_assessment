import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Body, NotFoundException } from '@nestjs/common';
import { CreateVideoDTO } from './dto/createVideo.dto.js';
import { UpdateVideoDTO } from './dto/updateVideo.dto.js';
import { StreamingService } from './streaming.service.js';

@Controller('api/streaming')
export class StreamingController {
    constructor(private readonly streamingService: StreamingService) {}

    @Get()
    findAll() {
        return this.streamingService.findAll();
    }

    @Get(':id')
    async getVideo(@Param('id', ParseIntPipe) id: number) {
        const res =  await this.streamingService.findOne(id);

        if (!res) {
            throw new NotFoundException('Entry not found!');
        }

        return res;
    }

    @Post()
    createVideo(@Body() createVideoDto: CreateVideoDTO) {
        return createVideoDto;
    }

    @Put(':id')
    editVideo(@Param('id', ParseIntPipe) id: number, @Body() updateVideoDto : UpdateVideoDTO) {
        return {
            id: id,
            updateVideoDto: updateVideoDto
        };
    }

    @Delete('id')
    deleteVideo(@Param('id', ParseIntPipe) id: number) {
        return id;
    }
}
