import { autocmd, Denops } from "./deps.ts";
import { ActionContext, isActionContext, setActionCtx } from "./action.ts";
import { getIssue, getIssues, updateIssue } from "./github/issue.ts";
import { getIssueTemplate } from "./github/repository.ts";
import { isIssueItem, IssueItem } from "./github/schema.ts";
import { obj2array } from "./utils/formatter.ts";
import { map } from "./mapping.ts";
import {
  menu,
  open,
  runTerminal,
  textEncoder,
  vimRegister,
} from "./utils/helper.ts";

export async function actionEditIssue(denops: Denops, ctx: ActionContext) {
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
    await denops.cmd("set ft=markdown buftype=acwrite");
    await denops.call("setline", 1, issue.body.split("\r\n"));
    await denops.cmd("setlocal nomodified");

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

    await denops.cmd("doautocmd User gh_open_issue");
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
    await updateIssue({ input });
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
    const issues = await getIssues({
      cond: {
        first: 30,
        owner: schema.owner,
        name: schema.repo,
        Filter: {
          states: ["open"],
        },
      },
    });
    if (issues.nodes.length === 0) {
      throw new Error("not found any issues");
    }
    await setIssueToBuffer(denops, ctx, issues.nodes);

    const keyMaps = [
      {
        defaultKey: "e",
        lhs: "<Plug>(gh-issue-edit)",
        rhs: `:<C-u>call gh#_action("issues:edit")<CR>`,
      },
      {
        defaultKey: "n",
        lhs: "<Plug>(gh-issue-new)",
        rhs: `:<C-u>new gh://${schema.owner}/${schema.repo}/issues/new<CR>`,
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

export async function actionNewIssue(
  denops: Denops,
  ctx: ActionContext,
): Promise<void> {
  const templates = await getIssueTemplate({
    repo: {
      owner: ctx.schema.owner,
      name: ctx.schema.repo,
    },
  });

  templates.push({ name: "Blank", body: "" });
  const templs = templates.map((t) => t.name);

  await menu(denops, templs, async (arg: unknown) => {
    // remove callback function from denops worker
    delete denops.dispatcher.menu_callback;

    const name = arg as string;
    const template = templates.filter((t) => t.name == name)[0];
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
  const text = (await denops.eval(`getline(1, "$")`) as string[]).join("\n");
  const data = textEncoder.encode(text);
  const tmp = await Deno.makeTempFile();
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
      const text = await denops.eval(`getline(1, "$")`) as string[];
      for (let i = text.length - 1; i > 0; i--) {
        const url = text[i];
        if (url.substring(0, 18) === "https://github.com") {
          const path = text[i].substring(19);
          await denops.cmd("bw");
          await denops.cmd("bw");
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
