import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RegisterUserDto } from './dto/registerUser.dto.js';
import { LoginUserDto } from './dto/loginUser.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({
        summary: 'Login user',
        description: 'Login user based on their credential. ( user@email.com / password )',
    })
    @ApiBody({ type: LoginUserDto })
    async login(@Body() loginUserDto: LoginUserDto) {
        return this.authService.login(loginUserDto);
    }

    @Post('register')
    @ApiOperation({
        summary: 'Create a user',
        description: 'Creates a new user in the database.',
    })
    @ApiBody({ type: RegisterUserDto })
    create(@Body() registerUserDto: RegisterUserDto): unknown {
        return this.authService.create(registerUserDto);
    }
}
