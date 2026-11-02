import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
} from 'class-validator';

export class CreateCustomerDto {
    @IsString()
    @IsNotEmpty()
    customer_id: string;

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
    mobile_number_2?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}