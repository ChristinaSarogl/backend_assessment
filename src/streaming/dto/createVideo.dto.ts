export class CreateVideoDTO {
    id: number;
    title: string;
    description: string;
    thumbnail_url: string;
    video_url: string;
    created_at: Date;
    updated_at: Date;
}