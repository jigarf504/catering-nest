import { Role } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
}
export interface JwtPayloadWithIat extends JwtPayload {
    iat: number;
    exp: number;
}
