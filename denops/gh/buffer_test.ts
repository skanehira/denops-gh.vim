import { assertEquals, assertThrows } from "./deps.ts";
import { buildSchema, isSchema } from "./buffer.ts";

{ // valid buffer name
  const tests = [
    {
      bufname: "gh://skanehira/gh.vim/issues",
      want: {
        owner: "skanehira",
        repo: "gh.vim",
        actionType: "issues:list",
      },
    },
    {
      bufname: "gh://skanehira/gh.vim/issues/4",
      want: {
        owner: "skanehira",
        repo: "gh.vim",
        actionType: "issues:edit",
        issue: {
          number: 4,
        },
      },
    },
    {
      bufname: "gh://skanehira/gh.vim/issues/4/assignees",
      want: {
        owner: "skanehira",
        repo: "gh.vim",
        actionType: "issues:assignees",
        issue: {
          number: 4,
        },
      },
    },
    {
      bufname: "gh://skanehira/gh.vim/issues/new",
      want: {
        owner: "skanehira",
        repo: "gh.vim",
        actionType: "issues:new",
      },
    },
    {
      bufname: "gh://skanehira/gh.vim/issues/4/comments",
      want: {
        owner: "skanehira",
        repo: "gh.vim",
        actionType: "comments:list",
        issue: {
          number: 4,
        },
      },
    },
    {
      bufname: "gh://skanehira/gh.vim/issues/4/comments/1123209",
      want: {
        owner: "skanehira",
        repo: "gh.vim",
        actionType: "comments:edit",
        issue: {
          number: 4,
        },
        comment: {
          id: 1123209,
        },
      },
    },
    {
      bufname: "gh://skanehira/gh.vim/issues/4/comments/new",
      want: {
        owner: "skanehira",
        repo: "gh.vim",
        actionType: "comments:new",
        issue: {
          number: 4,
        },
      },
    },
  ];

  for (const tt of tests) {
    Deno.test(`parse ${tt.bufname}`, () => {
      const got = buildSchema(tt.bufname);
      assertEquals(got, tt.want);
    });
  }
}

{ // invalid buffer name
  const tests = [
    {
      bufname: "gh://",
      want: "invalid buffer name 'gh://'",
    },
    {
      bufname: "gh://skanehira/",
      want: "invalid buffer name 'gh://skanehira/'",
    },
    {
      bufname: "gh://skanehira/sample/1/xx",
      want: "invalid buffer name 'gh://skanehira/sample/1/xx'",
    },
    {
      bufname: "gh://skanehira/sample/1",
      want: "invalid buffer name 'gh://skanehira/sample/1'",
    },
  ];

  for (const tt of tests) {
    Deno.test(`parse ${tt.bufname}`, () => {
      assertThrows(
        () => {
          buildSchema(tt.bufname);
        },
        Error,
        tt.want,
      );
    });
  }
}

Deno.test({
  name: "check valid schema",
  fn: () => {
    const s = {
      owner: "a",
      repo: "b",
      actionType: "issues:new",
    };

    isSchema(s);
  },
});

{
  const tests = [
    {
      owner: "a",
    },
    {
      repo: "b",
    },
    {
      actionType: "issues:list",
    },
    {
      owner: "a",
      repo: "b",
    },
    {
      owner: "ab",
      actionType: "issues:new",
    },
    {
      repo: "a",
      actionType: "issues:new",
    },
  ];

  for (const tt of tests) {
    Deno.test({
      name: `invalid schema: ${Deno.inspect(tt)}`,
      fn: () => {
        isSchema(tt);
      },
    });
  }
}
