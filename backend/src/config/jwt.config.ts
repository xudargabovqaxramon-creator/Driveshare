import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = (configService: ConfigService): JwtModuleOptions => {
  const secret = configService.get<string>('JWT_SECRET');

  /**
   * Security: refuse to start if JWT_SECRET is not set.
   * A missing secret would either crash at runtime or silently use a
   * predictable value — both are unacceptable in production.
   */
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required but not set. ' +
      'Set it to a long, random string (e.g. openssl rand -hex 64).',
    );
  }

  return {
    secret,
    signOptions: {
      expiresIn: configService.get<string>('JWT_EXPIRATION', '7d'),
    },
  };
};
