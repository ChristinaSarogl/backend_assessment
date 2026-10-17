import { IsDate, IsNumber, IsString } from "class-validator";

export class CreateVideoDTO {
    @IsNumber()
    id: number;

    @IsString()
    title: string;

    @IsString()
    description: string;
    
    @IsString()
    thumbnail_url: string;

    @IsString()
    video_url: string;

    @IsDate()
    created_at: Date;

    @IsDate()
    updated_at: Date;
}