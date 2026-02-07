import { UpdateToDoListDto } from '../dto/update-todo-list.dto';

export class UpdateTodoListCommand {
  constructor(
    public readonly id: string,
    public readonly updateToDoListDto: UpdateToDoListDto,
    public readonly userId: string,
  ) {}
}
