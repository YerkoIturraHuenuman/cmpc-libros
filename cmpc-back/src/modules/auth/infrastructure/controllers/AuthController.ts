import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { Audit } from '@/modules/audit/infrastructure/interceptors/Audit';
import type { AuthenticatedUser } from '@/common/dto/AuthenticatedUserDTO';
import { LoginDTO } from '../../application/dto/LoginDTO';
import { RefreshTokenDTO } from '../../application/dto/RefreshTokenDTO';
import {
  SessionResponseDTO,
  TokenResponseDTO,
} from '../../application/dto/TokenResponseDTO';
import { Login } from '../../application/use-cases/Login';
import { Logout } from '../../application/use-cases/Logout';
import { RefreshToken } from '../../application/use-cases/RefreshToken';
import { CurrentUser } from '../interceptors/guards/CurrentUser';
import { ACCESS_COOKIE } from '../interceptors/guards/JwtAuthGuard';
import { Public } from '../interceptors/guards/Public';
import { JwtTokenService } from '../services/JwtTokenService';

const LOGIN_LIMIT = { default: { limit: 5, ttl: 60_000 } };
const REFRESH_LIMIT = { default: { limit: 30, ttl: 60_000 } };

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly secure: boolean;

  constructor(
    private readonly login: Login,
    private readonly refresh: RefreshToken,
    private readonly logoutUseCase: Logout,
    private readonly tokens: JwtTokenService,
    config: ConfigService,
  ) {
    const override = config.get<string>('COOKIE_SECURE');
    this.secure =
      override !== undefined && override !== ''
        ? override === 'true'
        : config.get<string>('NODE_ENV') === 'production';
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Audit({ action: 'LOGIN', entity: 'Auth', bodyFields: ['email'] })
  @ApiOkResponse({ type: TokenResponseDTO })
  async loginHandler(
    @Body() dto: LoginDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDTO> {
    const result = await this.login.execute({
      email: dto.email,
      password: dto.password,
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    });
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Throttle(REFRESH_LIMIT)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Audit({ action: 'REFRESH', entity: 'Auth' })
  @ApiOkResponse({
    type: TokenResponseDTO,
    description:
      'Con el refresh token en el body devuelve los tokens nuevos. Si vino de la cookie, ' +
      'los tokens solo se entregan por cookie y el body trae únicamente el usuario.',
  })
  async refreshHandler(
    @Body() dto: RefreshTokenDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDTO | SessionResponseDTO> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = dto.refreshToken ?? cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException('Falta el refresh token');
    }

    const result = await this.refresh.execute(token);
    this.setCookies(res, result.accessToken, result.refreshToken);

    return dto.refreshToken ? result : { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiCookieAuth('access_token')
  @ApiCreatedResponse({ description: 'Sesión cerrada' })
  @Audit({ action: 'LOGOUT', entity: 'Auth' })
  async logoutHandler(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.logoutUseCase.execute(user.sessionId);
    res.clearCookie(ACCESS_COOKIE, this.cookieOptions(0));
    res.clearCookie(REFRESH_COOKIE, {
      ...this.cookieOptions(0),
      path: REFRESH_COOKIE_PATH,
    });
  }

  private setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(
      ACCESS_COOKIE,
      accessToken,
      this.cookieOptions(this.tokens.refreshTtlMs),
    );
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...this.cookieOptions(this.tokens.refreshTtlMs),
      path: REFRESH_COOKIE_PATH,
    });
  }

  private cookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: '/',
      maxAge,
    };
  }
}
