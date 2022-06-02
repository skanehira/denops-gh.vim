import { autocmd, Denops, isString, vars } from "./deps.ts";
import { getAssociatedPullRequest } from "./github/pull.ts";
import { endpoint } from "./github/api.ts";
import { buildSchema, initializeBuffer } from "./buffer.ts";
import {
  ActionContext,
  actionStore,
  ensureAction,
  getActionCtx,
  setActionCtx,
} from "./action.ts";

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

    helper.define(
      "BufReadCmd",
      "https://github.com/*",
      `call denops#notify("${denops.name}", "loadHttpBuffer", [])`,
    );
  });

  denops.dispatcher = {
    async loadHttpBuffer(): Promise<void> {
      const url = await denops.call("bufname") as string;
      const bufname = url.replace("https://github.com/", "gh://");
      await denops.cmd(`e ${bufname} | bw! ${url}`);
    },

    async loadBuffer(): Promise<void> {
      const bufname = await denops.call("bufname") as string;
      if (!isString(bufname)) {
        throw new Error(`bufname is not string: ${bufname}`);
      }
      try {
        const defaultCtx = (): ActionContext => {
          const schema = buildSchema(bufname);
          const ctx: ActionContext = { schema: schema };
          if (schema.actionType === "issues:list") {
            ctx.data = { filters: "state:open" };
          }
          return ctx;
        };

        const ctx = await vars.b.get(
          denops,
          "gh_action_ctx",
          defaultCtx(),
        );

        await setActionCtx(denops, ctx);
        await initializeBuffer(denops);
        await denops.dispatch(
          denops.name,
          "doAction",
          ctx.schema.actionType,
        );
      } catch (e) {
        console.error(e.message);
      }
    },

    async doAction(actionType: unknown): Promise<void> {
      try {
        const ctx = await getActionCtx(denops);
        const action = actionStore.get(ensureAction(actionType));
        if (!action) {
          throw new Error(`not found action: ${actionType}`);
        }
        await action(denops, ctx);
        if (denops.meta.host === "vim") {
          await denops.cmd("redraw!");
        }
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
      const url = await getAssociatedPullRequest({ endpoint, cond: req });
      console.log(url);
    },
  };
}
