export type UserRole = 'ADMIN' | 'USER';

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  role: UserRole;
}
