import { Role } from '@prisma/client';

export interface JwtPayload {
    sub: string;    // User ID
    email: string;
    role: Role;
}

export interface JwtPayloadWithIat extends JwtPayload {
    iat: number;
    exp: number;
}
