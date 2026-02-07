import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginInput } from './dto/login.input';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginInput, res: Response) {
    const user = await this.verifyUser(email, password);

    const expires = new Date();
    expires.setMilliseconds(
      expires.getTime() +
        parseInt(this.configService.getOrThrow('JWT_EXPIRATION_MS')),
    );

    const tokenPayload: TokenPayload = { userId: user.id };
    const accessToken = this.jwtService.sign(tokenPayload);

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: !!this.configService.get('SECURE_COOKIE'),
      expires,
    });

    return user;
  }

  async verifyUser(email: string, password: string) {
    try {
      const user = await this.userService.getUser({ email });
      const valid = await compare(password, user.password);
      if (!valid) throw new UnauthorizedException('Credentials are not valid.');
      return user;
    } catch (err) {
      throw new UnauthorizedException('Credentials are not valid.');
    }
  }
}
