import { getUsers, searchUsers } from "./user.ts";
import { assertEquals } from "../deps.ts";

Deno.test({
  name: "search user",
  fn: async (t) => {
    const get = (word: string) => {
      return searchUsers({
        word: word,
      });
    };

    const tests = [
      {
        name: "found user",
        word: "sk",
        expect: [
          {
            bio: "Like Vim, Go.\r\nMany CLI/TUI Tools, Vim plugins author.",
            id: "MDQ6VXNlcjc4ODg1OTE=",
            login: "skanehira",
            name: "skanehira",
          },
        ],
      },
      { name: "not found user", word: "notfound", expect: [] },
    ];

    for (const test of tests) {
      await t.step(test.name, async () => {
        const actual = await get(test.word);
        assertEquals(actual, test.expect);
      });
    }
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
      user0: {
        id: "MDQ6VXNlcjc4ODg1OTE=",
        login: "skanehira",
      },
      user1: {
        id: "MDQ6VXNlcjE4NzM3ODE5",
        login: "biosugar0",
      },
    };
    assertEquals(actual, expect);
  },
});
