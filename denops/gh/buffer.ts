import { Denops } from "./deps.ts";
import { ActionType } from "./action.ts";

export type BufferSchema = {
  owner: string;
  repo: string;
  actionType: ActionType;
  issue?: {
    number: number;
  };
  comment?: {
    id: number;
  };
  pulls?: {
    number: number;
  };
};

export const isSchema = (arg: unknown): arg is BufferSchema => {
  return ["owner", "repo", "actionType"].some((v) =>
    v in (arg as Record<string, unknown>)
  );
};

type Feature = "issues" | "comments" | "pulls";

const isFeature = (arg: string): arg is Feature => {
  return ["issues", "comments", "pulls"].some((v) => v === arg);
};

export const buildSchema = (bufname: string): BufferSchema => {
  const throwErr = () => {
    throw new Error(`invalid buffer name '${bufname}'`);
  };

  const path = bufname.substring(5);
  if (!path) {
    throwErr();
  }

  const fields = path.split("/");
  if (fields.length < 3) { // the schema must have owner and repo
    throwErr();
  }

  let [owner, repo, feature] = fields;

  if (!isFeature(feature)) {
    throwErr();
  }

  const schema = {
    owner,
    repo,
  } as BufferSchema;

  // []
  // ["new"]
  // ["4"]
  // ["4", "comments"]
  // ["4", "assignees"]
  // ["4", "comments", "1211311112"],
  // ["4", "comments", "new"]
  const undecided = fields.splice(3);
  const len = undecided.length;

  if (len === 0) {
    schema.actionType = `${feature}:list` as ActionType;
  }

  if (len > 0) {
    const v = undecided[0];
    if (v === "new") {
      schema.actionType = `${feature}:new` as ActionType;
    } else {
      const number = Number(v);
      if (!Number.isInteger(number)) {
        throwErr();
      }
      schema.actionType = `${feature}:edit` as ActionType;
      schema.issue = {
        number: number,
      };
    }
  }

  if (len > 1) {
    const v = undecided[1];
    switch (v) {
      case "comments":
        feature = "comments";
        schema.actionType = `${feature}:list` as ActionType;
        break;
      case "assignees":
        schema.actionType = `${feature}:assignees` as ActionType;
        break;
      case "labels":
        schema.actionType = `${feature}:labels` as ActionType;
        break;
      default:
        throwErr();
        break;
    }
  }

  if (len > 2) {
    const v = undecided[2];
    if (v === "new") {
      schema.actionType = `${feature}:new` as ActionType;
    } else {
      const id = Number(v);
      if (!Number.isInteger(id)) {
        throwErr();
      }
      schema.actionType = `${feature}:edit` as ActionType;
      schema.comment = {
        id: id,
      };
    }
  }

  return schema;
};

export async function initializeBuffer(denops: Denops): Promise<void> {
  await denops.cmd(
    `setlocal nolist buftype=nofile bufhidden=hide noswapfile nonumber cursorline nowrap`,
  );
}
