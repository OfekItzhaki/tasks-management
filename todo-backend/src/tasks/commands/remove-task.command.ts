export class RemoveTaskCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
