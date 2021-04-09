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
