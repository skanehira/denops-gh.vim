import { Candidate } from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { getCandidates, issueCache, userCache } from "./gh_issues.ts";
import { Denops, path, test } from "../gh/deps.ts";
import { setActionCtx } from "../gh/action.ts";
import { assertEqualFile, parseJSON } from "../gh/utils/test.ts";
import {
  IssueBodyFragment,
  MentionableUserFragment,
} from "../gh/github/graphql/operations.ts";

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

      await assertEqualFile(file, actual);
    } finally {
      issueCache.clear();
    }
  },
  timeout: 3000,
});

test({
  mode: "all",
  name: "autocomplete issue from cache",
  fn: async (denops: Denops) => {
    try {
      const cache = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "want_candidate_issue_list.json",
      );

      const candidates = await parseJSON<Candidate<IssueBodyFragment>[]>(
        cache,
      );
      for (const c of candidates) {
        issueCache.set(c.word, c);
      }

      await setActionCtx(denops, {
        schema: { owner: "skanehira", repo: "test", actionType: "issues:list" },
      });
      const actual = await getCandidates(denops, "#テスト");

      await assertEqualFile(cache, actual);
    } finally {
      issueCache.clear();
    }
  },
  timeout: 3000,
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

      await assertEqualFile(file, actual);
    } finally {
      issueCache.clear();
    }
  },
  timeout: 3000,
});

test({
  mode: "all",
  name: "autocomplete user from cache",
  fn: async (denops: Denops) => {
    try {
      const cache = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "want_candidate_user_list.json",
      );

      const candidates = await parseJSON<Candidate<MentionableUserFragment>[]>(
        cache,
      );
      for (const c of candidates) {
        userCache.set(c.word, c);
      }

      await setActionCtx(denops, {
        schema: { owner: "skanehira", repo: "test", actionType: "issues:list" },
      });
      const actual = await getCandidates(denops, "@s");

      await assertEqualFile(cache, actual);
    } finally {
      userCache.clear();
    }
  },
  timeout: 3000,
});
