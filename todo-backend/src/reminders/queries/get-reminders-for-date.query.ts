export class GetRemindersForDateQuery {
  constructor(
    public readonly userId: string,
    public readonly date: Date,
  ) {}
}
