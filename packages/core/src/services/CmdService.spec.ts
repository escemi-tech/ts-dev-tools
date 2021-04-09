import { CmdService } from "./CmdService";

describe("CmdService", () => {
  describe("execCmd", () => {
    it("should throws an error if no arguments is given", () => {
      const execCmdAction = () => CmdService.execCmd([]);

      expect(execCmdAction).toThrowError("Command args must not be empty");
    });

    it("should throws an error if given current working directory does not exist", () => {
      const execCmdAction = () => CmdService.execCmd(["test"], "wrong-path");

      expect(execCmdAction).toThrowError('Directory "wrong-path" does not exist');
    });
  });
});
