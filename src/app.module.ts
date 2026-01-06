/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './modules/product/product.module';

import { ConfigModule } from '@nestjs/config';
import { SellerModule } from './modules/seller/seller.module';
import { ClientModule } from './modules/client/client.module';

@Module({
  imports: [
    ProductModule,
    ConfigModule.forRoot({
      isGlobal: true, // lo hace accesible en todos lados
    }),
    SellerModule,
    ClientModule
  ],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}