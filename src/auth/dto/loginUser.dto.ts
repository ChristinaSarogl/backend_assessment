import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginUserDto {
    @ApiProperty({
        example: 'user@email.com',
        description: 'Email',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'password',
        description: 'Password',
        format: 'password'
    })
    @IsString()
    password: string;
}