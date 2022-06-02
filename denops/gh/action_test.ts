import { actionTypes, ensureAction } from "./action.ts";
import { assertRejects } from "./deps.ts";

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
