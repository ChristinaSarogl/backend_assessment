import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { User, UserRole } from './entities/user.entity.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserDto } from './dto/registerUser.dto.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/loginUser.dto.js';

interface CreatedUser {
    id: number,
    email: string
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService
    ) { }

    async create(registerUserDto: RegisterUserDto, userType: UserRole): Promise<CreatedUser> {
        const { email, password } = registerUserDto;
        // Find if the emai is already registered
        const res = await this.userRepository.findOneBy({ email });

        if (res) {
            throw new ConflictException('Email has been already registered');
        }

        // Create user
        const hashedPass = await bcrypt.hash(password, 12);

        const user = this.userRepository.create({
            email,
            password: hashedPass,
            user_role: userType
        });

        const savedUser = await this.userRepository.save(user);

        return {
            id: savedUser.id,
            email: savedUser.email
        };
    }

    async login(loginUserDto: LoginUserDto) {
        const { email, password } = loginUserDto;

        const user = await this.userRepository.findOneBy({ email });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials!');
        }

        //Check if password is right
        const validPass = await bcrypt.compare(password, user.password);

        if (!validPass) {
            throw new UnauthorizedException('Invalid credentials!');
        }

        //Create JWT payload
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.user_role
        }

        const accessToken = await this.jwtService.signAsync(payload);

        return accessToken;
    }
}
