const info = console.info;

export function mockConsoleInfo(): void {
  console.info = jest.fn();
}

export function resetMockedConsoleInfo(): void {
  console.info = info;
}

export function getConsoleInfoContent(): string {
  const calls = (console.info as jest.Mock)?.mock.calls;

  return calls.flat().join("\n");
}

export function stripAnsi(input: string): string {
  // Valid string terminator sequences are BEL, ESC\, and 0x9c
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
  ].join("|");
  return input.replace(new RegExp(pattern, "g"), "");
}
