import { CreateTaskDto } from '../dto/create-task.dto';

export class CreateTaskCommand {
  constructor(
    public readonly todoListId: string,
    public readonly createTaskDto: CreateTaskDto,
    public readonly userId: string,
  ) {}
}
