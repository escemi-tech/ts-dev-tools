import { type ExecException, exec as execProcess } from "node:child_process";

function getExitCode(error: ExecException | null): number {
  if (!error) {
    return 0;
  }

  return typeof error.code === "number" ? error.code : 1;
}

export function exec(
  cwd: string,
  cmd: string,
): Promise<{
  code: number;
  error: ExecException | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    execProcess(cmd, { cwd }, (error, stdout, stderr) => {
      resolve({
        code: getExitCode(error),
        error,
        stdout: stdout.trim(),
        stderr,
      });
    });
  });
}

export async function safeExec(cwd: string, cmd: string) {
  const { code, stderr, stdout } = await exec(cwd, cmd);
  if (code !== 0) {
    const error = [stderr, stdout].filter((error) => !!error).join("\n");

    throw new Error(
      `An error occurred while executing command "${cmd}": ${error}`,
    );
  }
  return stdout;
}
