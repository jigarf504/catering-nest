import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    @Length(7, 20)
    mobile_number: string;

    @IsOptional()
    @IsString()
    @Length(7, 20)
    @Transform(({ value }) => value === '' ? null : value)
    mobile_number_2?: string | null;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
