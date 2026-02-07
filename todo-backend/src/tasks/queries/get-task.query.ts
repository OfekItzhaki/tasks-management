export class GetTaskQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
