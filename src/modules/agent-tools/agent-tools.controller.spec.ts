import { Test, TestingModule } from '@nestjs/testing';
import { AgentToolsController } from './agent-tools.controller';

describe('AgentToolsController', () => {
  let controller: AgentToolsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentToolsController],
    }).compile();

    controller = module.get<AgentToolsController>(AgentToolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
