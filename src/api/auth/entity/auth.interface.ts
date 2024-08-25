/* eslint-disable prettier/prettier */
import { User } from '@modules/user';

export type iUser = Omit<User, 'hashedPassword'>;

export type AuthenticatedUser = iUser & { access_token: string };