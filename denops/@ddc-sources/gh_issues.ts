import {
  BaseSource,
  Candidate,
  Context,
  DdcOptions,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import { getIssues } from "../gh/github/issue.ts";
import { IssueItem } from "../gh/github/schema.ts";
import { getActionCtx } from "../gh/action.ts";

type Params = {
  maxSize: number;
};

const issueCache = new Map<string, IssueItem>();

export class Source extends BaseSource<Params, IssueItem> {
  async gatherCandidates(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Candidate<IssueItem>[]> {
    const pos = await args.denops.call("getcurpos") as number[];
    const col = pos[2];
    const word = args.context.input.substring(0, col).split(" ").at(-1);

    if (word?.at(0) !== "#") {
      return [];
    }

    if (issueCache.size >= 1) {
      const result = Array.from(issueCache.values()).filter((issue) =>
        issue.title.startsWith(word.slice(1))
      ).map(
        (issue) => {
          return {
            word: String(issue.number),
            info: issue.body,
            kind: "[Issue]",
            menu: issue.title,
            user_data: issue,
          };
        },
      );
      if (result.length) {
        return result;
      }
    }

    const action = await getActionCtx(args.denops);

    const result = await getIssues({
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

    for (const issue of result.nodes) {
      issue.body = issue.body.replaceAll("\r\n", "\n");
      issueCache.set(String(issue.number), issue);
    }

    return result.nodes.map((issue) => {
      return {
        word: String(issue.number),
        info: issue.body,
        kind: "[Issue]",
        menu: issue.title,
        user_data: issue,
      };
    });
  }

  async onCompleteDone(_args: { denops: Denops }): Promise<void> {
  }

  params(): Params {
    return {
      maxSize: 10,
    };
  }
}
