import { IsDate, IsNotEmpty, IsNumber, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateMovieDTO {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    id: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    description: string;
    
    @IsUrl()
    thumbnail_url: string;

    @IsUrl()
    video_url: string;

    @IsDate()
    created_at: Date;

    @IsDate()
    updated_at: Date;
}