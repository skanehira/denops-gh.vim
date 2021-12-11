import {
  BaseSource,
  Candidate,
  Context,
  DdcOptions,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import { getIssues } from "../gh/github/issue.ts";
import { IssueItem, ResultIssue } from "../gh/github/schema.ts";
import { getActionCtx } from "../gh/action.ts";
import { inprogress } from "../gh/utils/helper.ts";

type Params = {
  maxSize: number;
};

export const issueCache = new Map<string, Candidate<IssueItem>>();

export const getCandidates = async (
  denops: Denops,
  word: string,
): Promise<Candidate<IssueItem>[]> => {
  if (issueCache.size >= 1) {
    const result = Array.from(issueCache.values()).filter((candidate) =>
      candidate.user_data!.title.startsWith(word.slice(1))
    );
    if (result.length) {
      return result;
    }
  }

  const action = await getActionCtx(denops);

  const result = await inprogress<ResultIssue>(denops, async () => {
    return await getIssues({
      cond: {
        first: 10,
        name: action.schema.repo,
        owner: action.schema.owner,
        Filter: {
          states: ["open", "closed"],
          title: word.slice(1),
        },
      },
    });
  });

  const candidates = result!.nodes.map((issue) => {
    return {
      word: String(issue.number),
      info: issue.body,
      kind: "[Issue]",
      menu: issue.title,
      user_data: issue,
    };
  });
  for (const can of candidates) {
    issueCache.set(can.word, can);
  }

  return candidates;
};

export class Source extends BaseSource<Params, IssueItem> {
  async gatherCandidates(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Candidate<IssueItem>[]> {
    try {
      const pos = await args.denops.call("getcurpos") as number[];
      const col = pos[2];
      const word = args.context.input.substring(0, col).split(" ").at(-1);

      if (word?.at(0) !== "#") {
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
