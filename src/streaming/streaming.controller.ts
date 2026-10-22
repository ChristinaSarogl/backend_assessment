import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Body, NotFoundException, Query, DefaultValuePipe, Patch, BadRequestException, UseGuards } from '@nestjs/common';
import { CreateMovieDTO } from './dto/createMovie.dto.js';
import { UpdateMovieDTO } from './dto/updateMovie.dto.js';
import { StreamingService } from './streaming.service.js';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard.js';
import { RoleGuard } from '../guards/role.guard.js';
import { Roles } from '../guards/role.decorator.js';
import { UserRole } from '../auth/entities/user.entity.js';

@ApiTags('Streaming')
@ApiBearerAuth('access-token')
@Controller('api/streaming')
@UseGuards(AuthGuard, RoleGuard)
export class StreamingController {
    constructor(private readonly streamingService: StreamingService) { }

    @Roles(UserRole.ADMIN, UserRole.USER)
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
    @ApiQuery({
        name: 'genre',
        required: false,
        type: String,
        example: 'Drama',
        description: 'Movie genre',
    })
    async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('genre', new DefaultValuePipe('')) genre: string): Promise<any> {

        // Don't allow 0 or negative pages
        if (page < 1) {
            throw new BadRequestException('Page must be a positive integer greater than or equal to 1.');
        }


        //Limit the limit between 1 and 100 entries on each page
        if (limit < 1 || limit > 100) {
            throw new BadRequestException('Limit must be between 1 and 100.');
        }

        return await this.streamingService.findAll(page, limit, genre);
    }

    @Roles(UserRole.ADMIN, UserRole.USER)
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

    @Roles(UserRole.ADMIN, UserRole.USER)
    @Get(':id/play')
    @ApiOperation({
        summary: 'Get stream proxy route',
        description: 'Returns the movie url based on its ID.',
    })
    @ApiParam({
        name: 'id',
        required: false,
        type: String,
        example: '1',
        description: 'Id number (starting from 1)',
    })
    async streamMovie(@Param('id', ParseIntPipe) id: number) {
        const res = await this.streamingService.findOne(id);

        if (!res) {
            throw new NotFoundException(`Entry with ID ${id} not found!`);
        }

        return res.video_url;
    }

    @Roles(UserRole.ADMIN)
    @Post()
    @ApiOperation({
        summary: 'Create a movie',
        description: 'Creates a new movie in the database.',
    })
    @ApiBody({ type: CreateMovieDTO })
    async create(@Body() createMovieDto: CreateMovieDTO) {
        return await this.streamingService.create(createMovieDto);
    }

    @Roles(UserRole.ADMIN)
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

    @Roles(UserRole.ADMIN)
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
