import {
  BaseSource,
  Candidate,
  Context,
  DdcOptions,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import { Label } from "../gh/github/schema.ts";
import { getActionCtx } from "../gh/action.ts";
import { getRepoLabels } from "./gh_issues_search.ts";

type Params = {
  maxSize: number;
};

export class Source extends BaseSource<Params, Label> {
  async gatherCandidates(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Candidate<Label>[]> {
    const pos = await args.denops.call("getcurpos") as number[];
    const col = pos[2];
    const word = args.context.input.substring(0, col).split(" ").at(-1);

    if (!word) {
      return [];
    }

    const ctx = await getActionCtx(args.denops);
    const labels = await getRepoLabels(args.denops, ctx, word);
    return labels;
  }

  params(): Params {
    return {
      maxSize: 10,
    };
  }
}
