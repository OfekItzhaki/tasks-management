export class PermanentDeleteTaskCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
