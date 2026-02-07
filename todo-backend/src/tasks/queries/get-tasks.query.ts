export class GetTasksQuery {
  constructor(
    public readonly userId: string,
    public readonly todoListId?: string,
  ) {}
}
