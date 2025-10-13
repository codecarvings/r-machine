interface NextToolsBuilder {
  readonly createClient: any;
  readonly createServer: any;
}

export const NextTools: NextToolsBuilder = {
  createClient: undefined!,
  createServer: undefined!,
};
