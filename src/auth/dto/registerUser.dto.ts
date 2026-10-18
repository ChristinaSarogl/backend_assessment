import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterUserDto {
    @ApiProperty({
        example: 'user@email.com',
        description: 'Email',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'password',
        description: 'Password',
    })
    @IsString()
    @MinLength(8)
    password: string;
}