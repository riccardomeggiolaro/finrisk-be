/* eslint-disable prettier/prettier */
export enum Role {
    Customer = 'customer',
    Admin = 'admin'
}

export interface OptionsUser {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    role?: Role | null;
    abiCodeId?: string | null;
    username?: string | null;
    hashedPassword?: string | null;
    enabled?: boolean | null;
}