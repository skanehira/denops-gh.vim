import { autocmd, Denops, isString } from "./deps.ts";
import { getAssociatedPullRequest } from "./github/pr.ts";
import { endpoint } from "./github/api.ts";
import { buildSchema, initializeBuffer } from "./buffer.ts";
import { actionStore, getActionCtx, setActionCtx } from "./action.ts";

export async function main(denops: Denops): Promise<void> {
  await denops.cmd(
    `command! -nargs=? GhGetAssociatedPullRequest call denops#notify("${denops.name}", "getAssociatedPullRequest", [<f-args>])`,
  );

  await autocmd.group(denops, "gh_buffer", (helper) => {
    helper.define(
      "BufReadCmd",
      "gh://*",
      `call denops#notify("${denops.name}", "loadBuffer", [])`,
    );
  });

  denops.dispatcher = {
    async loadBuffer(): Promise<void> {
      const bufname = await denops.call("bufname") as string;
      if (!isString(bufname)) {
        throw new Error(`bufname is not string: ${bufname}`);
      }
      try {
        const schema = buildSchema(bufname);
        await setActionCtx(denops, { schema: schema });
        await initializeBuffer(denops);
        await denops.dispatch(
          denops.name,
          "doAction",
        );
      } catch (e) {
        console.error(e.message);
      }
    },

    async doAction(): Promise<void> {
      try {
        const ctx = await getActionCtx(denops);
        const schema = ctx.schema;
        const action = actionStore.get(schema.actionType);
        if (!action) {
          throw new Error(`not found action: ${schema.actionType}`);
        }
        await action(denops, ctx);
      } catch (err) {
        console.error(err.message);
      }
    },

    async getAssociatedPullRequest(...arg: unknown[]): Promise<void> {
      const parse = (): {
        owner?: string;
        name?: string;
        commit: string;
      } => {
        const args = (arg[0] as string).split(" ");
        if (args.length === 1) {
          return {
            commit: args[0] as string,
          };
        } else if (args.length === 3) {
          return {
            owner: args[0] as string,
            name: args[1] as string,
            commit: args[2] as string,
          };
        } else {
          throw new Error(`invalid args`);
        }
      };

      const req = parse();
      const url = await getAssociatedPullRequest(endpoint, req);
      console.log(url);
    },
  };
}
