import { Denops, vars } from "./deps.ts";
import { BufferSchema, isSchema } from "./buffer.ts";
import {
  actionCloseIssue,
  actionCreateIssue,
  actionEditIssue,
  actionListAssignees,
  actionListIssue,
  actionListLabels,
  actionNewIssue,
  actionOpenIssue,
  actionSearchIssues,
  actionUpdateAssignees,
  actionUpdateIssue,
  actionUpdateLabels,
  actionViewIssue,
} from "./action_issue.ts";
import { IssueBodyFragment } from "./github/graphql/operations.ts";

export type ActionType =
  | "issues:close"
  | "issues:open"
  | "issues:view"
  | "issues:new"
  | "issues:create"
  | "issues:edit"
  | "issues:update"
  | "issues:list"
  | "issues:search"
  | "issues:assignees"
  | "issues:assignees:update"
  | "issues:labels"
  | "issues:labels:update"
  | "pulls:new"
  | "pulls:list"
  | "pulls:edit"
  | "comments:list"
  | "comments:edit"
  | "comments:new";

export type ActionContext = {
  schema: BufferSchema;
  args?: unknown;
};

export type ActionFn = (
  denops: Denops,
  context: ActionContext,
) => Promise<void>;

export const getActionCtx = async (denops: Denops): Promise<ActionContext> => {
  const ctx = await vars.b.get(denops, "gh_action_ctx");
  if (!isActionContext(ctx)) {
    throw new Error("b:gh_action_ctx is not type of 'ActionContext'");
  }
  if (!isSchema(ctx.schema)) {
    throw new Error(`ctx.schema is not type of 'Schema': ${ctx.schema}`);
  }
  return ctx;
};

export const setActionCtx = async (
  denops: Denops,
  ctx: ActionContext,
): Promise<void> => {
  await vars.b.set(denops, "gh_action_ctx", ctx);
  return;
};

export const isActionContext = (arg: unknown): arg is ActionContext => {
  return ["schema"].some((v) => v in (arg as Record<string, unknown>));
};

export type IssueListArg = {
  issues?: IssueBodyFragment[];
  filters: string;
};

export const isIssueListArgs = (arg: unknown): arg is IssueListArg => {
  return ["filters"].some((v) => v in (arg as Record<string, unknown>));
};

export const actionStore = new Map<ActionType, ActionFn>(
  [
    ["issues:edit", actionEditIssue],
    ["issues:update", actionUpdateIssue],
    ["issues:list", actionListIssue],
    ["issues:new", actionNewIssue],
    ["issues:create", actionCreateIssue],
    ["issues:view", actionViewIssue],
    ["issues:search", actionSearchIssues],
    ["issues:open", actionOpenIssue],
    ["issues:close", actionCloseIssue],
    ["issues:assignees", actionListAssignees],
    ["issues:assignees:update", actionUpdateAssignees],
    ["issues:labels", actionListLabels],
    ["issues:labels:update", actionUpdateLabels],
  ],
);
