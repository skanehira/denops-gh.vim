import {
  BaseSource,
  Candidate,
  Context,
  DdcOptions,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import {
  getAssignableUsers,
  getLabels,
  getMentionableUsers,
} from "../gh/github/repository.ts";
import { searchUsers } from "../gh/github/user.ts";
import { IssueItem, Label, User } from "../gh/github/schema.ts";
import { ActionContext, getActionCtx } from "../gh/action.ts";
import { inprogress, trim } from "../gh/utils/helper.ts";

type Params = {
  maxSize: number;
};

export const authorCache = new Map<string, Candidate<User>>();
export const mentionableUserCache = new Map<string, Candidate<User>>();
export const assignableUserCache = new Map<string, Candidate<User>>();
export const labelCache = new Map<string, Candidate<Label>>();

export async function getUserList(
  denops: Denops,
  ctx: ActionContext,
  kind: "assignee" | "mentions" | "author" | "label",
  word: string,
): Promise<Candidate<User>[]> {
  let cache: Map<string, Candidate<User>>;
  let getUserFn: (args: {
    endpoint?: string;
    repo: {
      owner: string;
      name: string;
    };
    word: string;
  }) => Promise<User[]>;

  switch (kind) {
    case "assignee":
      {
        cache = assignableUserCache;
        getUserFn = getAssignableUsers;
      }
      break;
    case "mentions":
      {
        cache = mentionableUserCache;
        getUserFn = getMentionableUsers;
      }
      break;
    case "author":
      {
        cache = authorCache;
        getUserFn = searchUsers;
      }
      break;
    default:
      throw new Error(`invalid type of user qualifiers: '${kind}'`);
  }

  if (cache.size >= 1) {
    const result = Array.from(cache.values()).filter(
      (candidate) => {
        return candidate.user_data!.login.startsWith(word);
      },
    );
    if (result.length) {
      return result;
    }
  }

  const result = await inprogress<User[]>(denops, "fetching...", async () => {
    return await getUserFn({
      repo: {
        owner: ctx.schema.owner,
        name: ctx.schema.repo,
      },
      word: word,
    });
  });

  const candidates = result!.map((user) => {
    return {
      word: user.login,
      info: user.bio ? user.bio.replaceAll("\r\n", "\n") : "",
      kind: "[User]",
      menu: user.name ? user.name : "",
      user_data: user,
    };
  });
  for (const can of candidates) {
    cache.set(can.word, can);
  }
  return candidates;
}

async function getRepoLabels(
  denops: Denops,
  ctx: ActionContext,
  word: string,
): Promise<Candidate<Label>[]> {
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

  const result = await inprogress<Label[]>(denops, "fetching...", async () => {
    return await getLabels({
      repo: {
        owner: ctx.schema.owner,
        name: ctx.schema.repo,
      },
      word: word,
    });
  });

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

export const getCandidates = async (
  denops: Denops,
  kind: string,
  word: string,
): Promise<Candidate<User | Label>[]> => {
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

export class Source extends BaseSource<Params, IssueItem | User | Label> {
  async gatherCandidates(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Candidate<User | Label>[]> {
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
