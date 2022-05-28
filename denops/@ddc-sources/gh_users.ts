import { Candidate } from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import {
  getAssignableUsers,
  getMentionableUsers,
} from "../gh/github/repository.ts";
import { ActionContext } from "../gh/action.ts";
import {
  AssignableUserFragment,
  MentionableUserFragment,
} from "../gh/github/graphql/operations.ts";
import { inprogress } from "../gh/utils/helper.ts";

export type User =
  | AssignableUserFragment
  | MentionableUserFragment;

export const mentionableUserCache = new Map<string, Candidate<User>>();
export const assignableUserCache = new Map<string, Candidate<User>>();

export async function getUserList(
  denops: Denops,
  ctx: ActionContext,
  kind: "assignee" | "mentions" | "author",
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
    case "author":
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
