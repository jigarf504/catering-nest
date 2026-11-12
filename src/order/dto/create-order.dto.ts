import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsArray,
    ValidateNested,
    Min,
    MaxLength,
    IsMongoId,
    IsIn,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    description: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0.01)
    qty: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    rate: number;
}

export class CreateOrderDto {
    @IsIn(['order', 'quotation'])
    @IsOptional()
    order_type?: 'order' | 'quotation';

    @IsDateString()
    @IsOptional()
    order_date?: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    advanceAmount?: number;

    @IsMongoId()
    @IsNotEmpty()
    customerId: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    customerName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    mobile?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    mobile2?: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    address?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    cgstRate?: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    sgstRate?: number;
}
