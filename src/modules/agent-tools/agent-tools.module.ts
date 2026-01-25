import { Module } from '@nestjs/common';
import { AgentToolsService } from './agent-tools.service';
import { AgentToolsController } from './agent-tools.controller';
import { PrismaModule } from 'src/database/prisma.module';
import { ClientModule } from '../client/client.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [PrismaModule, ClientModule, OrderModule],
  providers: [AgentToolsService],
  controllers: [AgentToolsController],
})
export class AgentToolsModule {}
