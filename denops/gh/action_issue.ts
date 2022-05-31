import { autocmd, Denops, open, stringWidth } from "./deps.ts";
import {
  ActionContext,
  getActionCtx,
  isActionContext,
  isIssueListArgs,
  IssueListArg,
  setActionCtx,
} from "./action.ts";
import {
  addIssueComment,
  getIssue,
  getIssueComment,
  getIssueComments,
  getIssues,
  updateIssue,
  updateIssueComment,
} from "./github/issue.ts";
import { getUsers } from "./github/user.ts";
import { getIssueTemplate, getLabels } from "./github/repository.ts";
import {
  isIssueBody,
  isIssueComment,
  isIssueCommentList,
  isIssueList,
} from "./github/schema.ts";
import { obj2array } from "./utils/formatter.ts";
import { map } from "./mapping.ts";
import {
  inprogress,
  menu,
  runTerminal,
  textEncoder,
  vimRegister,
} from "./utils/helper.ts";
import {
  IssueBodyFragment,
  IssueCommentFragment,
  IssueTemplateBodyFragment,
} from "./github/graphql/operations.ts";
import * as Types from "./github/graphql/types.ts";

export async function actionEditIssue(denops: Denops, ctx: ActionContext) {
  await inprogress(denops, "loading...", async () => {
    const schema = ctx.schema;
    if (!schema.issue) {
      throw new Error(`invalid schema: ${schema}`);
    }

    try {
      const issue = await getIssue({
        cond: {
          owner: schema.owner,
          repo: schema.repo,
          number: schema.issue.number,
        },
      });
      await denops.call("setline", 1, issue.body.split("\n"));
      await denops.cmd("setlocal ft=markdown buftype=acwrite nomodified");

      ctx.args = issue;
      setActionCtx(denops, ctx);

      await autocmd.group(
        denops,
        `gh_issue_edit_${schema.issue.number}`,
        (helper) => {
          helper.remove("*", "<buffer>");
          helper.define(
            "BufWriteCmd",
            "<buffer>",
            `call gh#_action("issues:update")`,
          );
        },
      );

      const keyMaps = [
        {
          defaultKey: "ghm",
          lhs: "<Plug>(gh-issue-comments)",
          rhs: `:<C-u>call gh#_action("comments:list")<CR>`,
        },
        {
          defaultKey: "gha",
          lhs: "<Plug>(gh-issue-assignees)",
          rhs: `:<C-u>call gh#_action("issues:assignees")<CR>`,
        },
        {
          defaultKey: "ghl",
          lhs: "<Plug>(gh-issue-labels)",
          rhs: `:<C-u>call gh#_action("issues:labels")<CR>`,
        },
      ];

      for (const m of keyMaps) {
        await map(
          denops,
          m.defaultKey,
          m.lhs,
          m.rhs,
          {
            buffer: true,
            silent: true,
            mode: "n",
            noremap: true,
          },
        );
      }
      await denops.cmd("doautocmd User gh_open_issue");
    } catch (e) {
      console.error(e.message);
    }
  });
}

export async function actionUpdateIssue(denops: Denops, ctx: ActionContext) {
  if (!await denops.eval("&modified")) {
    // if issue body doesn't changed, do nothing
    return;
  }

  if (!isIssueBody(ctx.args)) {
    console.error(`ctx.args is not IssutItem: ${Deno.inspect(ctx.args)}`);
    return;
  }

  const body = await denops.call("getline", 1, "$") as string[];
  if (body.length === 1 && body[0] === "") {
    console.error("issue body cannot be empty");
    return;
  }

  const input = {
    id: ctx.args.id,
    body: body.join("\r\n"),
  };
  await inprogress(denops, "updating...", async () => {
    try {
      await updateIssue({ input });
      await denops.cmd("setlocal nomodified");
    } catch (e) {
      console.error(e.message);
    }
  });
}

export async function actionListIssue(denops: Denops, ctx: ActionContext) {
  if (!isActionContext(ctx)) {
    console.error(`ctx is not action context: ${Deno.inspect(ctx)}`);
    return;
  }
  if (!isIssueListArgs(ctx.args)) {
    console.error("ctx.args type is not 'IssueListArg'");
    return;
  }
  const args = ctx.args;

  const schema = ctx.schema;
  denops.cmd("setlocal ft=gh-issues modifiable");

  await inprogress(denops, "loading...", async () => {
    try {
      const issues = await getIssues({
        cond: {
          first: 30,
          owner: schema.owner,
          name: schema.repo,
          Filter: args.filters,
        },
      });
      if (issues.length === 0) {
        throw new Error("not found any issues");
      }
      await denops.cmd("silent %d_");
      await setIssueToBuffer(denops, ctx, issues);

      const keyMaps = [
        {
          defaultKey: "ghm",
          lhs: "<Plug>(gh-issue-comments)",
          rhs: `:<C-u>call gh#_action("comments:list")<CR>`,
        },
        {
          defaultKey: "gha",
          lhs: "<Plug>(gh-issue-assignees)",
          rhs: `:<C-u>call gh#_action("issues:assignees")<CR>`,
        },
        {
          defaultKey: "ghl",
          lhs: "<Plug>(gh-issue-labels)",
          rhs: `:<C-u>call gh#_action("issues:labels")<CR>`,
        },
        {
          defaultKey: "ghe",
          lhs: "<Plug>(gh-issue-edit)",
          rhs: `:<C-u>call gh#_action("issues:edit")<CR>`,
        },
        {
          defaultKey: "ghn",
          lhs: "<Plug>(gh-issue-new)",
          rhs: `:<C-u>new gh://${schema.owner}/${schema.repo}/issues/new<CR>`,
        },
        {
          defaultKey: "<C-o>",
          lhs: "<Plug>(gh-issue-view)",
          rhs: `:<C-u>call gh#_action("issues:view")<CR>`,
        },
        {
          defaultKey: "ghy",
          lhs: "<Plug>(gh-issue-yank)",
          rhs: `:<C-u>call gh#_action("issues:yank")<CR>`,
        },
        {
          defaultKey: "<C-j>",
          lhs: "<Plug>(gh-issue-select-next)",
          rhs: `:<C-u>call gh#_select_toggle('+')<CR>`,
        },
        {
          defaultKey: "<C-k>",
          lhs: "<Plug>(gh-issue-select-prev)",
          rhs: `:<C-u>call gh#_select_toggle('-')<CR>`,
        },
        {
          defaultKey: "ghs",
          lhs: "<Plug>(gh-issue-search)",
          rhs: `:<C-u>call gh#_action("issues:search")<CR>`,
        },
        {
          defaultKey: "ghc",
          lhs: "<Plug>(gh-issue-close)",
          rhs: `:<C-u>call gh#_action("issues:close")<CR>`,
        },
        {
          defaultKey: "gho",
          lhs: "<Plug>(gh-issue-open)",
          rhs: `:<C-u>call gh#_action("issues:open")<CR>`,
        },
        {
          defaultKey: "K",
          lhs: "<Plug>(gh-issue-preview)",
          rhs: `:<C-u>call gh#_action("issues:preview")<CR>`,
        },
      ];

      for (const m of keyMaps) {
        await map(
          denops,
          m.defaultKey,
          m.lhs,
          m.rhs,
          {
            buffer: true,
            silent: true,
            mode: "n",
            noremap: true,
          },
        );
      }
    } catch (e) {
      console.error(e.message);
    }
  });
}

export async function setIssueToBuffer(
  denops: Denops,
  ctx: ActionContext,
  issues: IssueBodyFragment[],
): Promise<void> {
  const objects = issues.map((issue) => {
    return {
      number: "#" + issue.number,
      title: stringWidth(issue.title) >= 100
        ? issue.title.slice(0, 100) + "..."
        : issue.title,
      state: issue.state as string,
      assignees: issue.assignees.nodes
        ? issue.assignees.nodes.slice(0, 2).map((user) => {
          return user?.login ? "@" + user.login : "";
        }).join(" ")
        : "",
      labels: `(${
        issue.labels?.nodes
          ? issue.labels.nodes.slice(0, 3)
            .map((label) => label?.name ?? "").join(", ")
          : ""
      })`,
      comment: issue.comments.nodes?.length
        ? `\uf41f ${issue.comments.nodes.length}`
        : "",
    };
  });
  const rows = obj2array(objects);
  await denops.call("setline", 1, rows);
  await denops.cmd("setlocal nomodifiable");

  (ctx.args as IssueListArg).issues = issues;
  await setActionCtx(denops, ctx);
}

export async function setIssueCommentsToBuffer(
  denops: Denops,
  ctx: ActionContext,
  comments: Required<IssueCommentFragment>,
): Promise<void> {
  comments.nodes;
  const objcts = comments.nodes.map((comment) => {
    return {
      author: comment.author?.login ? "@" + comment.author.login : "",
      comment: comment.body ? comment.body.split(/\r?\n/)[0] : "",
    };
  });
  const rows = obj2array(objcts);
  await denops.call("setline", 1, rows);
  await denops.cmd("setlocal nomodifiable");

  (ctx.args as Required<IssueCommentFragment>) = comments;
  await setActionCtx(denops, ctx);
}

export async function actionNewIssue(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  const templates = await inprogress<Required<IssueTemplateBodyFragment>[]>(
    denops,
    "loading...",
    async () => {
      const templates = await getIssueTemplate({
        repo: {
          owner: ctx.schema.owner,
          name: ctx.schema.repo,
        },
      });
      templates.push({ name: "Blank", body: "" });
      return templates;
    },
  );

  const templs = templates!.map((t) => t.name);
  await menu(denops, templs, async (arg: unknown) => {
    const name = arg as string;
    const template = templates!.filter((t) => t.name == name)[0];
    await denops.cmd("setlocal ft=markdown buftype=acwrite");
    if (name !== "Blank") {
      await denops.call("setline", 1, template.body.split("\n"));
    }
    await denops.cmd("setlocal nomodified");

    const bufnr = denops.call("bufnr");

    await autocmd.group(
      denops,
      `gh_issue_new_${bufnr}`,
      (helper) => {
        helper.remove("*", "<buffer>");
        helper.define(
          "BufWriteCmd",
          "<buffer>",
          `call gh#_action("issues:create")`,
        );
      },
    );

    await denops.cmd("doautocmd User gh_open_issue");
  });
}

export async function actionCreateIssue(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  const text = (await denops.call("getline", 1, "$") as string[]).join("\n");
  const data = textEncoder.encode(text);
  const tmp = await Deno.makeTempFile();
  const issueBufnr = await denops.call("bufnr");
  await Deno.writeFile(tmp, data);

  await runTerminal(denops, [
    "gh",
    "issue",
    "create",
    "-F",
    tmp,
    "-R",
    `${ctx.schema.owner}/${ctx.schema.repo}`,
  ], async (denops, exitCode) => {
    if (exitCode === 0) {
      const text = await denops.call("getline", 1, "$") as string[];
      for (let i = text.length - 1; i > 0; i--) {
        const url = text[i];
        if (url.substring(0, 18) === "https://github.com") {
          const path = text[i].substring(19);
          await denops.cmd("bw!");
          await denops.cmd(`bw! ${issueBufnr}`);
          const chosen = await denops.call("gh#_chose_action", [
            { text: "(e)dit", value: "edit" },
            { text: "(y)nk issue url", value: "yank" },
            { text: "(o)open browser", value: "open" },
          ]) as string;

          switch (chosen) {
            case "edit":
              await denops.cmd(`e gh://${path}`);
              break;
            case "yank":
              await denops.call("setreg", vimRegister, url);
              console.log(`yanked: ${url}`);
              break;
            case "open":
              open(url);
              break;
          }
          break;
        }
      }
    }
  });
}

export async function actionViewIssue(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  if (!isIssueListArgs(ctx.args)) {
    console.error(`ctx.args type is not 'IssueListArg'`);
    return;
  }
  if (ctx.args.issues!.length == 0) {
    return;
  }
  const idxs = await denops.call("gh#_get_selected_idx") as number[];
  if (!idxs.length) {
    const idx = (await denops.call("line", ".") as number) - 1;
    idxs.push(idx);
  }
  for (const idx of idxs) {
    const issue = ctx.args.issues![idx];
    open(issue.url);
  }
  await denops.call("gh#_clear_selected");
}

export async function actionSearchIssues(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  await actionListIssue(denops, ctx);
}

export async function actionOpenIssue(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  await changeIssueState(denops, ctx, Types.IssueState.Open);
}

export async function actionCloseIssue(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  await changeIssueState(denops, ctx, Types.IssueState.Closed);
}

export async function changeIssueState(
  denops: Denops,
  ctx: ActionContext,
  state: Types.IssueState,
): Promise<void> {
  if (!isIssueListArgs(ctx.args)) {
    console.error(`ctx.args type is not 'IssueListArg'`);
    return;
  }
  if (!ctx.args.issues) {
    return;
  }

  const issues = ctx.args.issues;

  if (issues.length == 0) {
    return;
  }

  const idxs = await denops.call("gh#_get_selected_idx") as number[];
  if (!idxs.length) {
    const idx = (await denops.call("line", ".") as number) - 1;
    idxs.push(idx);
  }

  const text = state === "OPEN" ? "opening..." : "closing...";
  await inprogress(denops, text, async () => {
    for (const idx of idxs) {
      const issue = issues[idx];
      await updateIssue({
        input: {
          id: issue.id,
          state: state,
        },
      });
    }
  });
  await actionSearchIssues(denops, await getActionCtx(denops));
  await denops.call("gh#_clear_selected");
}

export async function actionListAssignees(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  await inprogress(denops, "loading...", async () => {
    const schema = ctx.schema;
    if (!schema.issue) {
      throw new Error(`invalid schema: ${schema}`);
    }

    try {
      const issue = await getIssue({
        cond: {
          owner: schema.owner,
          repo: schema.repo,
          number: schema.issue.number,
        },
      });
      if (issue.assignees?.nodes) {
        const users = issue.assignees.nodes.map((user) => user?.login ?? "");
        await denops.call("setline", 1, users);
      }
      await denops.cmd(
        "setlocal ft=gh-issues-assignees buftype=acwrite nomodified",
      );

      ctx.args = issue;
      setActionCtx(denops, ctx);

      await autocmd.group(
        denops,
        `gh_issue_assignees_${schema.issue.number}`,
        (helper) => {
          helper.remove("*", "<buffer>");
          helper.define(
            "BufWriteCmd",
            "<buffer>",
            `call gh#_action("issues:assignees:update")`,
          );
        },
      );

      await denops.cmd("doautocmd User gh_open_issue_assignees");
    } catch (e) {
      console.error(e.message);
    }
  });
}

export async function actionUpdateAssignees(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  if (!await denops.eval("&modified")) {
    // if issue body doesn't changed, do nothing
    return;
  }
  const lines = (await denops.call("getline", 1, "$") as string[]).filter((l) =>
    l !== ""
  );
  let assignees: string[] = [];

  await inprogress(denops, "updating...", async () => {
    if (lines.length > 0) {
      if (lines.length > 10) {
        throw new Error("cannot assign more than 10 users");
      }
      const users = await getUsers({
        assignees: lines,
      });

      assignees = Object.values(users).map(
        (user) => user.id,
      );
    }

    await updateIssue({
      input: {
        id: (ctx.args as IssueBodyFragment).id,
        assigneeIds: assignees,
      },
    });
    await denops.cmd("setlocal nomodified");
  });
}

export async function actionListLabels(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  await inprogress(denops, "loading...", async () => {
    const schema = ctx.schema;
    if (!schema.issue) {
      throw new Error(`invalid schema: ${schema}`);
    }

    try {
      const issue = await getIssue({
        cond: {
          owner: schema.owner,
          repo: schema.repo,
          number: schema.issue.number,
        },
      });
      if (issue.labels?.nodes) {
        const labels = issue.labels.nodes.map((label) => label?.name ?? "");
        await denops.call("setline", 1, labels);
      }
      await denops.cmd("setlocal buftype=acwrite nomodified");

      ctx.args = issue;
      setActionCtx(denops, ctx);

      await autocmd.group(
        denops,
        `gh_issue_labels_${schema.issue.number}`,
        (helper) => {
          helper.remove("*", "<buffer>");
          helper.define(
            "BufWriteCmd",
            "<buffer>",
            `call gh#_action("issues:labels:update")`,
          );
        },
      );

      await denops.cmd("doautocmd User gh_open_issue_labels");
    } catch (e) {
      console.error(e.message);
    }
  });
}

export async function actionUpdateLabels(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  if (!await denops.eval("&modified")) {
    // if issue body doesn't changed, do nothing
    return;
  }
  const lines = (await denops.call("getline", 1, "$") as string[]).filter((l) =>
    l !== ""
  );
  let labels: string[] = [];

  await inprogress(denops, "updating...", async () => {
    if (lines.length > 0) {
      const resp = await getLabels({
        repo: {
          owner: ctx.schema.owner,
          name: ctx.schema.repo,
        },
        labels: lines,
      });

      labels = Object.values(resp).map(
        (repo) => repo.label.id,
      );
    }

    await updateIssue({
      input: {
        id: (ctx.args as IssueBodyFragment).id,
        labelIds: labels,
      },
    });
    await denops.cmd("setlocal nomodified");
  });
}

export async function actionEditIssueComment(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  await inprogress(denops, "loading...", async () => {
    const schema = ctx.schema;
    if (!schema.comment?.id) {
      throw new Error(`invalid schema: ${schema}`);
    }

    try {
      const comment = await getIssueComment({
        owner: schema.owner,
        repo: schema.repo,
        id: schema.comment.id,
      });

      await denops.call("setline", 1, comment.body.split(/\r?\n/));
      await denops.cmd("setlocal ft=markdown buftype=acwrite nomodified");

      ctx.args = comment;
      setActionCtx(denops, ctx);

      await autocmd.group(
        denops,
        `gh_issue_comment_${schema.comment.id}`,
        (helper) => {
          helper.remove("*", "<buffer>");
          helper.define(
            "BufWriteCmd",
            "<buffer>",
            `call gh#_action("comments:update")`,
          );
        },
      );

      await denops.cmd("doautocmd User gh_open_issue_comment");
    } catch (e) {
      console.error(e.message);
    }
  });
}

export async function actionUpdateIssueComment(
  denops: Denops,
  ctx: ActionContext,
) {
  if (!await denops.eval("&modified")) {
    // if issue body doesn't changed, do nothing
    return;
  }

  if (!ctx.schema.comment?.id) {
    throw new Error(`ctx.schema is not comment: ${ctx.schema}`);
  }

  if (!isIssueComment(ctx.args)) {
    throw new Error(`ctx.args is not comment: ${ctx.args}`);
  }

  const body = await denops.call("getline", 1, "$") as string[];
  if (body.length === 1 && body[0] === "") {
    console.error("comment body cannot be empty");
    return;
  }

  const input = {
    owner: ctx.schema.owner,
    repo: ctx.schema.repo,
    id: ctx.schema.comment.id,
    body: body.join("\r\n"),
  };
  await inprogress(denops, "updating...", async () => {
    try {
      await updateIssueComment(input);
      await denops.cmd("setlocal nomodified");
    } catch (e) {
      console.error(e.message);
    }
  });
}

const hasIssueComments = (
  arg: IssueCommentFragment,
): arg is Required<IssueCommentFragment> => {
  return !!arg.nodes && arg.nodes.length > 0;
};

export async function actionListIssueComment(
  denops: Denops,
  ctx: ActionContext,
) {
  const schema = ctx.schema;
  if (!schema.issue?.number) {
    throw new Error(`invalid schema: ${JSON.stringify(schema)}`);
  }
  const number = schema.issue.number;

  await denops.cmd("setlocal ft=gh-issues-comments modifiable");

  await inprogress(denops, "loading...", async () => {
    try {
      // currently, just show 100 comments max.
      const comments = await getIssueComments({
        owner: schema.owner,
        name: schema.repo,
        number: number,
      });

      const keyMaps = [
        {
          defaultKey: "ghe",
          lhs: "<Plug>(gh-issue-comment-edit)",
          rhs: `:<C-u>call gh#_action("comments:edit")<CR>`,
        },
        {
          defaultKey: "ghn",
          lhs: "<Plug>(gh-issue-comment-new)",
          rhs: `:<C-u>call gh#_action("comments:new")<CR>`,
        },
        {
          defaultKey: "K",
          lhs: "<Plug>(gh-issue-comment-preview)",
          rhs: `:<C-u>call gh#_action("comments:preview")<CR>`,
        },
      ];

      // if not found any comment, just apply keymap
      if (!hasIssueComments(comments)) {
        await map(
          denops,
          keyMaps[1].defaultKey,
          keyMaps[1].lhs,
          keyMaps[1].rhs,
          {
            buffer: true,
            silent: true,
            mode: "n",
            noremap: true,
          },
        );

        return;
      }

      await denops.cmd("silent %d_");

      await setIssueCommentsToBuffer(
        denops,
        ctx,
        comments,
      );

      for (const m of keyMaps) {
        await map(
          denops,
          m.defaultKey,
          m.lhs,
          m.rhs,
          {
            buffer: true,
            silent: true,
            mode: "n",
            noremap: true,
          },
        );
      }
    } catch (e) {
      console.error(e.message);
    }
  });
}

export async function actionNewIssueComment(
  denops: Denops,
  ctx: ActionContext,
) {
  await denops.cmd("setlocal ft=markdown buftype=acwrite nomodified");

  await autocmd.group(
    denops,
    `gh_issue_comment_new_${ctx.schema.issue?.number}`,
    (helper) => {
      helper.remove("*", "<buffer>");
      helper.define(
        "BufWriteCmd",
        "<buffer>",
        `call gh#_action("comments:create")`,
      );
    },
  );
}

export async function actionCreateIssueComment(
  denops: Denops,
  ctx: ActionContext,
) {
  if (!await denops.eval("&modified")) {
    // if issue body doesn't changed, do nothing
    return;
  }

  const schema = ctx.schema;
  if (!schema.issue?.number) {
    throw new Error(`invalid schema: ${JSON.stringify(schema)}`);
  }

  const body = await denops.call("getline", 1, "$") as string[];
  if (body.length === 1 && body[0] === "") {
    throw new Error("comment body cannot be empty");
  }

  await addIssueComment({
    owner: schema.owner,
    repo: schema.repo,
    issueNumber: schema.issue.number,
    body: body.join("\r\n"),
  });

  await denops.cmd("bw!");
}

export async function actionPreview(denops: Denops, ctx: ActionContext) {
  const ft = await denops.eval("&ft");
  let body = "";
  switch (ft) {
    case "gh-issues": {
      if (!isIssueList(ctx.args)) {
        throw new Error(`ctx.args type is not 'IssueListArg'`);
      }
      const line = await denops.call("line", ".") as number;
      const issue = ctx.args.issues.at(line - 1);
      if (!issue) {
        throw new Error("not found issue");
      }
      body = issue.body;
      break;
    }
    case "gh-issues-comments": {
      if (!isIssueCommentList(ctx.args)) {
        throw new Error(`ctx.args type is not 'IssueCommentList'`);
      }
      const line = await denops.call("line", ".") as number;
      const comment = ctx.args.nodes.at(line - 1);
      if (!comment) {
        throw new Error("not found comment");
      }
      body = comment.body;
      break;
    }
  }

  const bufname = "gh:preview";
  const bufnr = await denops.call("bufadd", bufname);
  await denops.batch(
    ["bufload", bufnr],
    ["utils#deletebufline", bufnr, 1, "$"],
    [
      "setbufline",
      bufnr,
      1,
      body.split(/\r?\n/),
    ],
  );

  if (await denops.call("bufwinid", bufnr) === -1) {
    const oldwin = await denops.call("win_getid");
    await denops.cmd(
      `vnew ${bufname} | setlocal buftype=nofile ft=markdown | nnoremap <buffer> <silent> q :bw!<CR>`,
    );
    await denops.call("win_gotoid", oldwin);
  }
}
