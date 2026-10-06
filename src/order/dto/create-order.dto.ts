import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsArray,
    ValidateNested,
    Min,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    description: string;

    @IsNumber()
    @Min(0.01)
    qty: number;

    @IsNumber()
    @Min(0)
    rate: number;
}

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    customerName: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    customerPhone?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsNumber()
    @Min(0)
    @IsOptional()
    cgstRate?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    sgstRate?: number;
}
