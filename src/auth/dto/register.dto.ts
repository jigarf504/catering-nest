import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;

    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(128, { message: 'Password must not exceed 128 characters' })
    password!: string;

    @IsString({ message: 'First name must be a string' })
    @IsNotEmpty({ message: 'First name is required' })
    @MinLength(1, { message: 'First name must be at least 1 character long' })
    @MaxLength(50, { message: 'First name must not exceed 50 characters' })
    firstName!: string;

    @IsString({ message: 'Last name must be a string' })
    @IsNotEmpty({ message: 'Last name is required' })
    @MinLength(1, { message: 'Last name must be at least 1 character long' })
    @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
    lastName!: string;
}
