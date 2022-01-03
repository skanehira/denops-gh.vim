import { getUsers } from "./user.ts";
import { assertEquals } from "../deps.ts";

Deno.test({
  name: "get users id",
  fn: async () => {
    const actual = await getUsers({
      assignees: [
        "skanehira",
        "mattn",
      ],
    });

    const expect = {
      data: {
        user0: {
          id: "MDQ6VXNlcjc4ODg1OTE=",
          login: "skanehira",
        },
        user1: {
          id: "MDQ6VXNlcjEwMTEx",
          login: "mattn",
        },
      },
    };
    assertEquals(actual, expect);
  },
});
