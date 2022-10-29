import {
  BaseSource,
  Context,
  DdcOptions,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v3.0.0/types.ts";
import { Denops } from "https://deno.land/x/ddc_vim@v3.0.0/deps.ts";
import { getActionCtx } from "../gh/action.ts";
import { LabelBodyFragment } from "../gh/github/graphql/operations.ts";
import { getUserList, User } from "./gh_users.ts";
import { getRepoLabels } from "./gh_issues_labels.ts";

type Params = {
  maxSize: number;
};

export const getCandidates = async (
  denops: Denops,
  kind: string,
  word: string,
): Promise<Item<User | LabelBodyFragment>[]> => {
  const ctx = await getActionCtx(denops);

  switch (kind) {
    case "author":
    case "assignee":
    case "mentions":
      return getUserList(denops, ctx, kind, word);
    case "label":
      return getRepoLabels(denops, ctx, word);
  }
  return [];
};

export class Source extends BaseSource<Params, User | LabelBodyFragment> {
  async gather(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Item<User | LabelBodyFragment>[]> {
    try {
      const pos = await args.denops.call("getcurpos") as number[];
      const col = pos[2];
      const word = args.context.input.substring(0, col).split(" ").at(-1);

      if (!word) {
        return [];
      }

      const [kind, text] = word.split(":");

      return await getCandidates(args.denops, kind, text);
    } catch (e) {
      console.error(e.message);
      return [];
    }
  }

  params(): Params {
    return {
      maxSize: 10,
    };
  }
}
