import { CreateStepDto } from '../dto/create-step.dto';

export class CreateStepCommand {
  constructor(
    public readonly taskId: string,
    public readonly dto: CreateStepDto,
    public readonly userId: string,
  ) {}
}
