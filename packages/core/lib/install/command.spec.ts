import { createTestProjectDir, removeTestProjectDir } from "../tests/utils";
import { install } from "./command";

describe("Install command", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  it("should run installation", () => {
    install({ cwd: testProjectDir, dir: "." });
  });
});
