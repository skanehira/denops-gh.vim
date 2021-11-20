import { getIssues } from "./issue.ts";

Deno.test({
  name: "get issues",
  fn: async () => {
    await getIssues({ Owner: "skanehira", Name: "gh.vim" });
  },
});
