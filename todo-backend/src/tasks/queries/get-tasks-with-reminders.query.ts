export class GetTasksWithRemindersQuery {
  constructor(
    public readonly userId: string,
    public readonly date: Date,
  ) {}
}
