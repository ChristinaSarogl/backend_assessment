import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Body } from '@nestjs/common';
import { CreateVideoDTO } from './dto/createVideo.dto.js';
import { UpdateVideoDTO } from './dto/updateVideo.dto.js';

@Controller('api/streaming')
export class StreamingController {
    @Get()
    getVideoList() {
        return 'paginated list';
    }

    @Get(':id')
    getVideo(@Param('id', ParseIntPipe) id: number){
        return id;
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
