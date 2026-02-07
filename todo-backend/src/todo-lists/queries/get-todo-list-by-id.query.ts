export class GetTodoListByIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
