import { ActionFn, ActionType } from "./buffer.ts";
import { actionApdateIssue, actionEditIssue } from "./buffer_issue.ts";

export const actionStore = new Map<ActionType, ActionFn>(
  [
    ["issues:edit", actionEditIssue],
    ["issues:update", actionApdateIssue],
  ],
);
