import { Candidate } from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import {
  getAssignableUsers,
  getMentionableUsers,
} from "../gh/github/repository.ts";
import { ActionContext } from "../gh/action.ts";
import { UserFragment } from "../gh/github/graphql/operations.ts";
import { inprogress } from "../gh/utils/helper.ts";

export const mentionableUserCache = new Map<string, Candidate<UserFragment>>();
export const assignableUserCache = new Map<string, Candidate<UserFragment>>();

export async function getUserList(
  denops: Denops,
  ctx: ActionContext,
  kind: "assignee" | "mentions" | "author",
  word: string,
): Promise<Candidate<UserFragment>[]> {
  let cache: Map<string, Candidate<UserFragment>>;
  let getUserFn: (args: {
    endpoint?: string;
    repo: {
      owner: string;
      name: string;
    };
    word: string;
  }) => Promise<UserFragment[]>;

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

  const result = await inprogress<UserFragment[]>(
    denops,
    "fetching...",
    async () => {
      return await getUserFn({
        repo: {
          owner: ctx.schema.owner,
          name: ctx.schema.repo,
        },
        word: word,
      });
    },
  );

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
