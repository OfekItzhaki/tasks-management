export class GetStepsQuery {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
  ) {}
}
