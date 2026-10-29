import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '@/common/database/prisma/PrismaService';
import { Public } from './modules/auth/infrastructure/interceptors/guards/Public';

@SkipThrottle()
@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  @ApiOkResponse({ description: 'La API está arriba' })
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Public()
  @Get('health/ready')
  @ApiOkResponse({ description: 'La API y la base de datos responden' })
  @ApiServiceUnavailableResponse({ description: 'La base de datos no responde' })
  async ready(): Promise<{ status: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('La base de datos no responde');
    }
    return { status: 'ok', database: 'up' };
  }
}
