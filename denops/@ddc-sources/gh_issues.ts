import {
  BaseSource,
  Candidate,
  Context,
  DdcOptions,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops, vars } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import { getIssues } from "../gh/github/issue.ts";
import { endpoint } from "../gh/github/api.ts";
import { IssueItem } from "../gh/github/schema.ts";
import { BufferSchema, isSchema } from "../gh/buffer.ts";

type Params = {
  maxSize: number;
};

const cache = new Map<string, IssueItem>();

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

    if (cache.size >= 1) {
      const result = Array.from(cache.values()).filter((issue) =>
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

    const schema = await vars.b.get(args.denops, "gh_schema") as BufferSchema;
    if (!isSchema(schema)) {
      console.error(`invalid schema: ${schema}`, schema);
      return [];
    }

    const result = await getIssues(endpoint, {
      first: 10,
      name: schema.repo,
      owner: schema.owner,
      Filter: {
        states: ["open", "closed"],
        title: word.slice(1),
      },
    });

    for (const issue of result.nodes) {
      issue.body = issue.body.replaceAll("\r\n", "\n");
      cache.set(String(issue.number), issue);
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
