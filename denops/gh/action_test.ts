import { actionTypes, ensureAction, isIssueListArgs } from "./action.ts";
import { assertEquals, assertRejects } from "./deps.ts";

Deno.test("valid action type", () => {
  for (const action of actionTypes) {
    ensureAction(action);
  }
});

Deno.test("invalid action", () => {
  const action = "xxxx";
  assertRejects(
    async () => {
      return await new Promise(() => {
        return ensureAction(action);
      });
    },
    Error,
    `invalid action: ${action}`,
  );
});

Deno.test("valid IssueListArg", () => {
  const input = {
    filters: "state:open",
  };
  assertEquals(isIssueListArgs(input), true);
});

Deno.test("unexpect IssueListArg", async (t) => {
  const inputs = [
    null,
    undefined,
    {},
  ];
  for (const input of inputs) {
    await t.step(`unexpect: ${input}`, () => {
      assertEquals(isIssueListArgs(input), false);
    });
  }
});
