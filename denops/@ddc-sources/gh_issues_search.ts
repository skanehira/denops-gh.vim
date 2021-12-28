import {
  BaseSource,
  Candidate,
  Context,
  DdcOptions,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import { getMentionableUsers } from "../gh/github/repository.ts";
import { IssueItem, User } from "../gh/github/schema.ts";
import { ActionContext, getActionCtx } from "../gh/action.ts";
import { inprogress } from "../gh/utils/helper.ts";

type Params = {
  maxSize: number;
};

export const userCache = new Map<string, Candidate<User>>();

async function getMentionsUsers(
  denops: Denops,
  action: ActionContext,
  word: string,
): Promise<Candidate<User>[]> {
  if (userCache.size >= 1) {
    const result = Array.from(userCache.values()).filter((candidate) => {
      return candidate.user_data!.login.startsWith(word);
    });
    if (result.length) {
      return result;
    }
  }

  const result = await inprogress<User[]>(denops, async () => {
    return await getMentionableUsers({
      repo: {
        owner: action.schema.owner,
        name: action.schema.repo,
      },
      word: word,
    });
  });

  const candidates = result!.map((user) => {
    return {
      word: user.login,
      info: user.bio?.replaceAll("\r\n", "\n"),
      kind: "[User]",
      user_data: user,
    };
  });
  for (const can of candidates) {
    userCache.set(can.word, can);
  }
  return candidates;
}

export const getCandidates = async (
  denops: Denops,
  kind: string,
  word: string,
): Promise<Candidate<User>[]> => {
  const action = await getActionCtx(denops);

  switch (kind) {
    case "assignee":
      return [];
    case "mentions":
      return getMentionsUsers(denops, action, word);
    case "label":
      return [];
  }
  return [];
};

const validQualifier = [
  "mentions:",
  "assignee:",
  "author:",
  "label:",
];

export class Source extends BaseSource<Params, IssueItem | User> {
  async gatherCandidates(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Candidate<User>[]> {
    try {
      const pos = await args.denops.call("getcurpos") as number[];
      const col = pos[2];
      const word = args.context.input.substring(0, col).split(" ").at(-1);

      if (!word) {
        return [];
      }

      if (!validQualifier.some((q) => word.includes(q))) {
        return [];
      }

      const [kind, text] = word.split(":");

      return await getCandidates(args.denops, kind, text);
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
