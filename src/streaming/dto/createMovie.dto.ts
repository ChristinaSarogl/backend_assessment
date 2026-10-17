import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, IsUrl, MaxLength } from "class-validator";

// Data Tranfer Object - Define shape of incoming data
export class CreateMovieDTO {
    @ApiProperty({
        example: 'Inception',
        description: 'Movie title',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiProperty({
        example: 'A science fiction thriller',
        description: 'Movie description',
    })
    @IsString()
    description: string;

    @ApiProperty({
        example: 'Sci-fi',
        description: 'Movie genre',
    })
    @IsString()
    genre: string;

    @ApiProperty({
        example: 'https://example.com/inception.jpg',
        description: 'Movie thumbnail URL',
    })
    @IsUrl()
    thumbnail_url: string;

    @ApiProperty({
        example: 'https://example.com/inception.mp4',
        description: 'Movie video URL',
    })
    @IsUrl()
    video_url: string;
}