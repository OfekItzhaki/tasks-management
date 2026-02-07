export class RemoveStepCommand {
  constructor(
    public readonly stepId: string,
    public readonly userId: string,
  ) {}
}
