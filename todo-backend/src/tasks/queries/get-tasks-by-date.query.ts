export class GetTasksByDateQuery {
  constructor(
    public readonly userId: string,
    public readonly date: Date,
  ) {}
}
