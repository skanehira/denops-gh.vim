import { Candidate } from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { getCandidates, issueCache, userCache } from "./gh_issues.ts";
import { Denops, path, test } from "../gh/deps.ts";
import { setActionCtx } from "../gh/action.ts";
import { assertEqualFile, parseJSON } from "../gh/utils/test.ts";
import { IssueItem, User } from "../gh/github/schema.ts";

test({
  mode: "all",
  name: "autocomplete issue from github api",
  fn: async (denops: Denops) => {
    try {
      await setActionCtx(denops, {
        schema: { owner: "skanehira", repo: "test", actionType: "issues:list" },
      });
      const actual = await getCandidates(denops, "#テスト");

      const file = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "want_candidate_issue_list.json",
      );

      assertEqualFile(file, actual);
    } finally {
      issueCache.clear();
    }
  },
});

test({
  mode: "all",
  name: "autocomplete issue from cache",
  fn: async (denops: Denops) => {
    try {
      const cacheFile = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "want_candidate_issue_list.json",
      );

      const candidates = await parseJSON<Candidate<IssueItem>[]>(cacheFile);
      for (const c of candidates) {
        issueCache.set(c.word, c);
      }

      await setActionCtx(denops, {
        schema: { owner: "skanehira", repo: "test", actionType: "issues:list" },
      });
      const actual = await getCandidates(denops, "#テスト");

      const file = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "want_candidate_issue_list.json",
      );

      assertEqualFile(file, actual);
    } finally {
      issueCache.clear();
    }
  },
});

test({
  mode: "all",
  name: "autocomplete user from github api",
  fn: async (denops: Denops) => {
    try {
      await setActionCtx(denops, {
        schema: { owner: "skanehira", repo: "test", actionType: "issues:list" },
      });
      const actual = await getCandidates(denops, "@s");

      const file = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "want_candidate_user_list.json",
      );

      assertEqualFile(file, actual);
    } finally {
      issueCache.clear();
    }
  },
});

test({
  mode: "all",
  name: "autocomplete user from cache",
  fn: async (denops: Denops) => {
    try {
      const cacheFile = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "want_candidate_user_list.json",
      );

      const candidates = await parseJSON<Candidate<User>[]>(cacheFile);
      for (const c of candidates) {
        userCache.set(c.word, c);
      }

      await setActionCtx(denops, {
        schema: { owner: "skanehira", repo: "test", actionType: "issues:list" },
      });
      const actual = await getCandidates(denops, "@s");

      const file = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "want_candidate_user_list.json",
      );

      assertEqualFile(file, actual);
    } finally {
      userCache.clear();
    }
  },
});
