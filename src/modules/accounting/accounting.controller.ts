import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { RegisterPaymentDto } from './dto/register-payment.dto';

@ApiTags('accounting')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('payments')
  async registerPayment(@Body() dto: RegisterPaymentDto) {
    return this.accountingService.recordPayment({
      clientId: dto.clientId,
      amount: dto.amount,
      method: dto.method,
      date: dto.date ? new Date(dto.date) : undefined,
      reference: dto.reference,
      note: dto.note,
      allocations: dto.allocations,
    });
  }
}
