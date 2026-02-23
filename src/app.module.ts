/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './modules/product/product.module';

import { ConfigModule } from '@nestjs/config';
import { SellerModule } from './modules/seller/seller.module';
import { ClientModule } from './modules/client/client.module';
import { OrderModule } from './modules/order/order.module';
import { AgentToolsModule } from './modules/agent-tools/agent-tools.module';
import { AccountingModule } from './accounting/accounting.module';
import { AccountingModule } from './modules/accounting/accounting.module';


@Module({
  imports: [
    ProductModule,
    ConfigModule.forRoot({
      isGlobal: true, // lo hace accesible en todos lados
    }),
    SellerModule,
    ClientModule,
    OrderModule,
    AgentToolsModule,
    AccountingModule
  ],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}