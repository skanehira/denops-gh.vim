import { getUsers, searchUsers } from "./user.ts";
import { assertEquals } from "../deps.ts";

Deno.test({
  name: "search user",
  fn: async () => {
    const actual = await searchUsers({
      word: "sk",
    });

    assertEquals(actual, [
      {
        bio: "Like Vim, Go.\r\nMany CLI/TUI Tools, Vim plugins author.",
        id: "MDQ6VXNlcjc4ODg1OTE=",
        login: "skanehira",
        name: "skanehira",
      },
    ]);
  },
});

Deno.test({
  name: "get users id",
  fn: async () => {
    const actual = await getUsers({
      assignees: [
        "skanehira",
        "biosugar0",
      ],
    });

    const expect = {
      data: {
        user0: {
          id: "MDQ6VXNlcjc4ODg1OTE=",
          login: "skanehira",
        },
        user1: {
          id: "MDQ6VXNlcjE4NzM3ODE5",
          login: "biosugar0",
        },
      },
    };
    assertEquals(actual, expect);
  },
});
