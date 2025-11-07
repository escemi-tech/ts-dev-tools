import { ExecException, exec as execProcess } from "child_process";

export function exec(
  cwd: string,
  cmd: string
): Promise<{
  code: number;
  error: ExecException | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    execProcess(cmd, { cwd }, (error, stdout, stderr) => {
      resolve({
        code: error && error.code ? error.code : 0,
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

    throw new Error(`An error occured while executing command "${cmd}": ${error}`);
  }
  return stdout;
}

