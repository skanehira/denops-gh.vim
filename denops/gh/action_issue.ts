import { autocmd, Denops, mapping } from "./deps.ts";
import {
  ActionContext,
  defaults,
  isActionContext,
  setActionCtx,
} from "./action.ts";
import { getIssue, getIssues, updateIssue } from "./github/issue.ts";
import { isIssueItem, IssueItem } from "./github/schema.ts";
import { obj2array } from "./utils/formatter.ts";

export async function actionEditIssue(denops: Denops, ctx: ActionContext) {
  const schema = ctx.schema;
  if (!schema.issue) {
    throw new Error(`invalid schema: ${schema}`);
  }

  try {
    const issue = await getIssue(defaults.endpoint, {
      owner: schema.owner,
      repo: schema.repo,
      number: schema.issue.number,
    });
    await denops.call("setline", 1, issue.body.split("\n"));
    await denops.cmd("set ft=markdown nomodified buftype=acwrite");

    schema.actionType = "issues:update";
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

    // if Shougo/ddc.vim is installed, autocomeplete issue and user name in buffer.
    if (await denops.call("exists", "*ddc#custom#patch_buffer")) {
      await denops.call(
        "ddc#custom#patch_buffer",
        "sources",
        ["gh_issues"],
      );

      await denops.call("ddc#custom#patch_buffer", "sourceOptions", {
        gh_issues: { matcherKey: "menu" },
      });
      await denops.call(
        "ddc#custom#patch_buffer",
        "specialBufferCompletion",
        true,
      );
    }

    // if matsui54/denops-popup-preview.vim is installed,
    // preview autocomplete info.
    await denops.call("popup_preview#enable");

    const oldOpt = await denops.eval("&completeopt") as string;
    const opt = oldOpt.split(",").filter((v) => v !== "preview").join(",");
    await denops.cmd(
      `set completeopt=${opt}`,
    );

    // restore completopt when buffer is wipeouted
    await autocmd.group(
      denops,
      `gh_issue_bufwipe_${schema.issue.number}`,
      (helper) => {
        helper.remove("*", "<buffer>");
        helper.define(
          "BufWipeout",
          "<buffer>",
          `set completeopt=${oldOpt}`,
        );
      },
    );
  } catch (e) {
    console.error(e.message);
  }
}

export async function actionUpdateIssue(denops: Denops, ctx: ActionContext) {
  if (!await denops.eval("&modified")) {
    // if issue body doesn't changed, do nothing
    return;
  }

  if (!isIssueItem(ctx.args)) {
    console.error(`ctx.args is not IssutItem: ${Deno.inspect(ctx.args)}`);
    return;
  }

  const body = await denops.eval(`getline(1, "$")`) as string[];
  if (body.length === 1 && body[0] === "") {
    console.error("issue body cannot be empty");
    return;
  }

  const input = {
    id: ctx.args.id,
    body: body.join("\r\n"),
  };
  try {
    await updateIssue(defaults.endpoint, input);
    await denops.cmd("setlocal nomodified");
  } catch (e) {
    console.error(e.message);
  }
}

export async function actionListIssue(denops: Denops, ctx: ActionContext) {
  if (!isActionContext(ctx)) {
    console.error(`ctx is not action context: ${Deno.inspect(ctx)}`);
    return;
  }
  const schema = ctx.schema;

  denops.cmd("setlocal ft=gh-issues");

  try {
    const issues = await getIssues(defaults.endpoint, {
      first: 30,
      owner: schema.owner,
      name: schema.repo,
      Filter: {
        states: ["open"],
      },
    });
    if (issues.nodes.length === 0) {
      throw new Error("not found any issues");
    }
    await setIssueToBuffer(denops, ctx, issues.nodes);

    // TODO refactoring
    await mapping.map(
      denops,
      "e",
      `:call gh#_action("issues:edit")<CR>`,
      {
        buffer: true,
        silent: true,
        mode: "n",
        noremap: true,
      },
    );
  } catch (e) {
    console.error(e.message);
  }
}

export async function setIssueToBuffer(
  denops: Denops,
  ctx: ActionContext,
  issues: IssueItem[],
): Promise<void> {
  const objs = issues.map((issue) => {
    return {
      number: "#" + issue.number,
      title: issue.title,
      state: issue.state as string,
      author: "@" + issue.author.login,
      assignees: issue.assignees.nodes.slice(0, 2).map((user) => {
        return "@" + user.login;
      }).join(" "),
      labels: `(${issue.labels.nodes.map((label) => label.name).join(", ")})`,
      comment: issue.comments.nodes.length
        ? `\uf41f ${issue.comments.nodes.length}`
        : "",
    };
  });
  const rows = obj2array(objs);
  await denops.call("setline", 1, rows);
  await denops.cmd("setlocal nomodifiable");

  ctx.args = issues;
  await setActionCtx(denops, ctx);
}
