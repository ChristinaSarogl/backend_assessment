import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    //Check whether the authorization header exists in the request
    if (typeof authHeader !== 'string'){
      throw new UnauthorizedException('Missing authorization header');
    }

    const parts = authHeader.split(' ');

    //Check if the header has the format of 'Bearer token'
    if (parts.length !==2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const token = parts[1];

    try {
      const decoded = this.jwtService.verify(token);

      request.user = decoded;
      return true;

    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('An eeror occured during authorization verification.');
    }
  }
}