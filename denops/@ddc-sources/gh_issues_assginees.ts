import {
  BaseSource,
  Context,
  DdcOptions,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v3.0.0/types.ts";
import { Denops } from "https://deno.land/x/ddc_vim@v3.0.0/deps.ts";
import { getActionCtx } from "../gh/action.ts";
import { getUserList, User } from "./gh_users.ts";

type Params = {
  maxSize: number;
};

export class Source extends BaseSource<Params, User> {
  async gather(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Item<User>[]> {
    const pos = await args.denops.call("getcurpos") as number[];
    const col = pos[2];
    const word = args.context.input.substring(0, col).split(" ").at(-1);

    if (!word) {
      return [];
    }

    const ctx = await getActionCtx(args.denops);
    const users = await getUserList(args.denops, ctx, "assignee", word);
    return users;
  }

  params(): Params {
    return {
      maxSize: 10,
    };
  }
}
