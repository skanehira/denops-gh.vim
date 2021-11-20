import { assertEquals } from "../deps.ts";
import { getRepo, parseRemote } from "./git.ts";

Deno.test({
  name: "get repository info",
  fn: async () => {
    const repo = await getRepo();
    const want = {
      Owner: "skanehira",
      Name: "denops-gh.vim",
    };
    assertEquals(want, repo);
  },
});

{
  const tests = [
    "ssh://git@github.com/skanehira/github-blame",
    "ssh://git@github.com/skanehira/github-blame.git",
    "ssh://github.com/skanehira/github-blame.git",
    "ssh://github.com/skanehira/github-blame",
    "git@github.com:skanehira/github-blame.git",
    "git@github.com:skanehira/github-blame",
    "http://github.com/skanehira/github-blame",
    "http://github.com/skanehira/github-blame.git",
    "https://github.com/skanehira/github-blame",
    "https://github.com/skanehira/github-blame.git",
  ];

  const want = {
    Owner: "skanehira",
    Name: "github-blame",
  };

  for (const t of tests) {
    Deno.test({
      name: `parse "${t}"`,
      fn: () => {
        const repo = parseRemote(t);
        assertEquals(repo, want);
      },
    });
  }
}
