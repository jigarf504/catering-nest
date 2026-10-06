import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsEnum,
    Min,
    MaxLength,
    ValidateIf,
} from 'class-validator';
import { PaymentMode } from '@prisma/client';

export class AddPaymentDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsEnum(PaymentMode)
    @IsNotEmpty()
    mode: PaymentMode;

    @ValidateIf((o) => o.mode === PaymentMode.CHEQUE)
    @IsString()
    @IsNotEmpty({ message: 'Cheque number is required for cheque payments' })
    @MaxLength(50)
    chequeNumber?: string;

    @ValidateIf((o) => o.mode === PaymentMode.CHEQUE)
    @IsString()
    @IsNotEmpty({ message: 'Cheque date is required for cheque payments' })
    chequeDate?: string;

    @ValidateIf((o) => o.mode === PaymentMode.CHEQUE)
    @IsString()
    @IsNotEmpty({ message: 'Bank name is required for cheque payments' })
    @MaxLength(100)
    chequeBank?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    note?: string;
}
