import { UpdateStepDto } from '../dto/update-step.dto';

export class UpdateStepCommand {
  constructor(
    public readonly stepId: string,
    public readonly dto: UpdateStepDto,
    public readonly userId: string,
  ) {}
}
