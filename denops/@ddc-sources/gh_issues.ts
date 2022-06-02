import {
  BaseSource,
  Candidate,
  Context,
  DdcOptions,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import { getIssues } from "../gh/github/issue.ts";
import { getMentionableUsers } from "../gh/github/repository.ts";
import { getActionCtx } from "../gh/action.ts";
import { inprogress } from "../gh/utils/helper.ts";
import {
  IssueBodyFragment,
  UserFragment,
} from "../gh/github/graphql/operations.ts";

type Params = {
  maxSize: number;
};

export const issueCache = new Map<string, Candidate<IssueBodyFragment>>();
export const userCache = new Map<
  string,
  Candidate<UserFragment>
>();

export const getCandidates = async (
  denops: Denops,
  word: string,
): Promise<Candidate<IssueBodyFragment | UserFragment>[]> => {
  const completeIssue = word?.at(0) === "#";
  const action = await getActionCtx(denops);

  if (completeIssue) {
    if (issueCache.size >= 1) {
      const result = Array.from(issueCache.values()).filter((candidate) =>
        candidate.user_data!.title.startsWith(word.slice(1))
      );
      if (result.length) {
        return result;
      }
    }

    const result = await inprogress<IssueBodyFragment[]>(
      denops,
      "fetching...",
      async () => {
        return await getIssues({
          cond: {
            first: 10,
            name: action.schema.repo,
            owner: action.schema.owner,
            Filter: `state:open state:closed ${word.slice(1)} in:title`,
          },
        });
      },
    );

    const candidates = result!.map((issue) => {
      return {
        word: String(issue.number),
        info: issue.body.replaceAll("\r\n", "\n"),
        kind: "[Issue]",
        menu: issue.title,
        user_data: issue,
      };
    });
    for (const can of candidates) {
      issueCache.set(can.word, can);
    }

    return candidates;
  }

  if (userCache.size >= 1) {
    const result = Array.from(userCache.values()).filter((candidate) =>
      candidate.user_data!.login.includes(word.slice(1))
    );
    if (result.length) {
      return result;
    }
  }

  const result = await inprogress<UserFragment[]>(
    denops,
    "fetching...",
    async () => {
      return await getMentionableUsers({
        repo: {
          owner: action.schema.owner,
          name: action.schema.repo,
        },
        word: word.slice(1),
      });
    },
  );

  const candidates = result!.map((user) => {
    return {
      word: user.login,
      info: user.bio?.replaceAll("\r\n", "\n"),
      kind: "[User]",
      menu: user.login,
      user_data: user,
    };
  });
  for (const can of candidates) {
    userCache.set(can.word, can);
  }
  return candidates;
};

export class Source
  extends BaseSource<Params, IssueBodyFragment | UserFragment> {
  async gatherCandidates(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Candidate<IssueBodyFragment | UserFragment>[]> {
    try {
      const pos = await args.denops.call("getcurpos") as number[];
      const col = pos[2];
      const word = args.context.input.substring(0, col).split(" ").at(-1);

      if (word?.at(0) !== "#" && word?.at(0) !== "@") {
        return [];
      }

      return await getCandidates(args.denops, word);
    } catch (e) {
      console.error(e.message);
      return [];
    }
  }

  async onCompleteDone(_args: { denops: Denops }): Promise<void> {
  }

  params(): Params {
    return {
      maxSize: 10,
    };
  }
}
