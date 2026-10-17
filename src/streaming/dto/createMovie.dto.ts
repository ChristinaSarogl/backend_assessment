import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNotEmpty, IsNumber, IsString, IsUrl, MaxLength } from "class-validator";

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