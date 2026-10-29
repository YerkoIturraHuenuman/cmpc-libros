import { Inject, Injectable } from '@nestjs/common';
import { SESSION_REPOSITORY } from '@/common/config/di-tokens';
import { FlowLogger } from '@/common/logging/FlowLogger';
import type { SessionRepositoryPort } from '../../domain/ports/SessionRepositoryPort';

@Injectable()
export class Logout {
  private readonly flow = new FlowLogger(Logout.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
  ) {}

  execute(sessionId: string): Promise<void> {
    return this.flow.track('execute', { sessionId }, () =>
      this.sessions.revoke(sessionId),
    );
  }
}
