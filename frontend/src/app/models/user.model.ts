export type UserStatusType = 'focus' | 'online' | 'meeting';

export interface User {
  id?: number;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  status?: UserStatusType;
}
