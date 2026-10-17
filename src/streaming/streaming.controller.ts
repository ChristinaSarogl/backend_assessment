import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Body, NotFoundException, Query, DefaultValuePipe, Patch } from '@nestjs/common';
import { CreateMovieDTO } from './dto/createMovie.dto.js';
import { UpdateMovieDTO } from './dto/updateMovie.dto.js';
import { StreamingService } from './streaming.service.js';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('streaming')
@Controller('api/streaming')
export class StreamingController {
    constructor(private readonly streamingService: StreamingService) { }

    @Get()
    @ApiOperation({
        summary: 'Get paginated movies',
        description: 'Returns movies using page-based pagination.',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: String,
        example: '1',
        description: 'Page number (starting from 1)',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: String,
        example: '20',
        description: 'Number of movies per page',
    })
    async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number): Promise<any> {
        return await this.streamingService.findAll(page, limit);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get a single movie',
        description: 'Returns a movie based on its ID.',
    })
    @ApiParam({
        name: 'id',
        required: false,
        type: String,
        example: '1',
        description: 'Id number (starting from 1)',
    })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const res = await this.streamingService.findOne(id);

        if (!res) {
            throw new NotFoundException(`Entry with ID ${id} not found!`);
        }

        return res;
    }

    @Post()
    @ApiOperation({
        summary: 'Create a movie',
        description: 'Creates a new movie in the database.',
    })
    @ApiBody({ type: CreateMovieDTO })
    async create(@Body() createMovieDto: CreateMovieDTO) {
        return await this.streamingService.create(createMovieDto);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update a movie',
        description: 'Partially updates an existing movie.',
    })
    @ApiParam({
        name: 'id',
        required: false,
        type: String,
        example: '1',
        description: 'Id number (starting from 1)',
    })
    @ApiBody({
        type: UpdateMovieDTO,
    })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateMovieDto: UpdateMovieDTO) {
        return await this.streamingService.update(id, updateMovieDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete a movie',
        description: 'Permanently deletes a movie by its ID.',
    })
    @ApiParam({
        name: 'id',
        required: false,
        type: String,
        example: '1',
        description: 'Id number (starting from 1)',
    })
    async delete(@Param('id', ParseIntPipe) id: number) {
        return await this.streamingService.remove(id);
    }
}
