import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/common/dto/AuthenticatedUserDTO';
import { CurrentUser } from '@/modules/auth/infrastructure/interceptors/guards/CurrentUser';
import { UserResponseDTO } from '../../application/dto/UserResponseDTO';
import { GetMyProfile } from '../../application/use-cases/GetMyProfile';

@ApiTags('users')
@ApiBearerAuth()
@ApiCookieAuth('access_token')
@Controller('users')
export class UsersController {
  constructor(private readonly getMyProfile: GetMyProfile) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDTO })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDTO> {
    return this.getMyProfile.execute(user.userId);
  }
}
