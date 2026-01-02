import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@pm/db';

@Injectable()
export class AuthService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: { email: string; password: string; name: string }) {
    if (await this.prisma.user.findUnique({ where: { email: dto.email } })) {
      throw new ConflictException('Email exists');
    }
    const user = await this.prisma.user.create({
      data: { ...dto, password: await bcrypt.hash(dto.password, 12) },
    });
    return { user: { id: user.id, email: user.email, name: user.name }, ...await this.tokens(user.id) };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException();
    }
    return { user: { id: user.id, email: user.email, name: user.name }, ...await this.tokens(user.id) };
  }

  async refresh(token: string) {
    try {
      const { sub } = this.jwt.verify(token, { secret: this.config.get('JWT_REFRESH_SECRET') });
      return this.tokens(sub);
    } catch {
      throw new UnauthorizedException();
    }
  }

  private async tokens(userId: string) {
    const payload = { sub: userId };
    return {
      accessToken: await this.jwt.signAsync(payload, { secret: this.config.get('JWT_SECRET'), expiresIn: '15m' }),
      refreshToken: await this.jwt.signAsync(payload, { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' }),
    };
  }
}
