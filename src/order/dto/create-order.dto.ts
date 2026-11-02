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
    @IsMongoId()
    @IsNotEmpty()
    customerId: string;

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