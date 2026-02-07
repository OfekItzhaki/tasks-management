export class ReorderStepsCommand {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
    public readonly stepIds: string[],
  ) {}
}
