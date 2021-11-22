import { Denops } from "./deps.ts";
import { getPRWithCommitHash } from "./github/pr.ts";

export async function main(denops: Denops): Promise<void> {
  await denops.cmd(
    `command! -nargs=? GhGetPRWithCommit call denops#notify("${denops.name}", "getPRWithCommit", [<f-args>])`,
  );

  denops.dispatcher = {
    async getPRWithCommit(...arg: unknown[]): Promise<void> {
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
      const url = await getPRWithCommitHash(req);
      console.log(url);
    },
  };
}
