import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

test("GitHub Action keeps verification and evidence boundaries explicit", async () => {
  const action = await readFile("action.yml", "utf8");

  assert.match(action, /^name: SkillBench Verify/m);
  assert.match(action, /using: composite/);
  assert.match(action, /skill-path:/);
  assert.match(action, /node .*dist\/src\/cli\.js.* validate/);
  assert.match(action, /actions\/upload-artifact@v4/);
  assert.match(action, /if-no-files-found: warn/);
  assert.doesNotMatch(action, /continue-on-error:\s*true/);
});

test("example workflow uses a pinned SkillBench revision placeholder", async () => {
  const example = await readFile("examples/github-action.yml", "utf8");

  assert.match(example, /uses: Altairpaca\/skillbench@v0/);
  assert.match(example, /skill-path:/);
  assert.match(example, /permissions:\n\s+contents: read/);
});
