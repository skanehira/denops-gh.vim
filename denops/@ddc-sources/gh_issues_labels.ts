import {
  BaseSource,
  Context,
  DdcOptions,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v3.0.0/types.ts";
import { Denops } from "https://deno.land/x/ddc_vim@v3.0.0/deps.ts";
import { LabelBodyFragment } from "../gh/github/graphql/operations.ts";
import { searchLabels } from "../gh/github/repository.ts";
import { ActionContext, getActionCtx } from "../gh/action.ts";
import { inprogress, trim } from "../gh/utils/helper.ts";

export const labelCache = new Map<string, Item<LabelBodyFragment>>();

export async function getRepoLabels(
  denops: Denops,
  ctx: ActionContext,
  word: string,
): Promise<Item<LabelBodyFragment>[]> {
  // if label has white space, query must be sourround by `"`,
  // so, if user typed query contains `"` both ends, isn't be used seraching label.
  word = trim(word, `"`);

  if (labelCache.size >= 1) {
    const result = Array.from(labelCache.values()).filter(
      (candidate) => {
        return candidate.user_data!.name.startsWith(word);
      },
    );
    if (result.length) {
      return result;
    }
  }

  const result = await inprogress<LabelBodyFragment[]>(
    denops,
    "fetching...",
    async () => {
      return await searchLabels({
        repo: {
          owner: ctx.schema.owner,
          name: ctx.schema.repo,
        },
        word: word,
      });
    },
  );

  const candidates = result!.map((label) => {
    return {
      word: label.name,
      info: label.description,
      kind: "[Label]",
      user_data: label,
    };
  });
  for (const can of candidates) {
    labelCache.set(can.word, can);
  }
  return candidates;
}

type Params = {
  maxSize: number;
};

export class Source extends BaseSource<Params, LabelBodyFragment> {
  async gather(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Item<LabelBodyFragment>[]> {
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
