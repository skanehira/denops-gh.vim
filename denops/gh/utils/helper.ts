import { Denops, ensureNumber, stringWidth } from "../deps.ts";

export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

export const onece = <A extends unknown, R extends Promise<unknown>>(
  f: (arg?: A) => R,
) => {
  let v: R | undefined;
  return (arg?: A): R => {
    return v || (v = f(arg));
  };
};

export const menu = async (
  denops: Denops,
  list: string[],
  callback: (arg: unknown) => Promise<void>,
) => {
  if (denops.meta.host === "nvim") {
    await nvimMenu(denops, list);
  } else {
    await vimMenu(denops, list);
  }
  // NOTE: workaround
  // register callback function to call from vim
  // its will remove when done
  denops.dispatcher["menu_callback"] = async (arg: unknown): Promise<void> => {
    await callback(arg);
    delete denops.dispatcher.menu_callback;
  };
};

export async function nvimMenu(denops: Denops, text: string[]) {
  const height = text.length;
  const width = Math.max(...text.map((v) => stringWidth(v)));

  const buf = await denops.call("nvim_create_buf", 0, 1);
  await denops.call("nvim_buf_set_lines", buf, 0, -1, 1, text);

  const [lines, columns] = await denops.batch(
    ["eval", "&lines"],
    ["eval", "&columns"],
  ) as number[];

  const row = (lines - height) / 2 - 2;
  const col = (columns - width) / 2;

  const opts = {
    "relative": "editor",
    "width": width,
    "height": height,
    "col": col,
    "row": row,
    "style": "minimal",
    "focusable": true,
    "border": ["╭", "─", "╮", "│", "╯", "─", "╰", "│"].map(
      (v) => [v, "NormalFloat"],
    ),
  };

  const win = await denops.call("nvim_open_win", buf, 1, opts);
  await denops.call(
    "win_execute",
    win,
    "nnoremap <silent> <buffer> <C-c> :bw!<CR>",
  );
  await denops.call(
    "win_execute",
    win,
    `nnoremap <silent> <buffer> <CR> :call gh#_menu_callback(${win}, getline("."))<CR>`,
  );
}

export async function vimMenu(denops: Denops, text: string[]) {
  await denops.call("popup_menu", text, {
    callback: "gh#_menu_callback",
  });
}

export async function runTerminal(
  denops: Denops,
  cmd: string[],
  callback?: (denops: Denops, exitCode: number) => Promise<void>,
): Promise<void> {
  let jobid = -1;
  if (denops.meta.host === "nvim") {
    await denops.cmd("new");
    const args = [cmd.join(" ")] as unknown[];
    if (callback) {
      args.push({ on_exit: "gh#_nvim_on_exit_terminal" });
    }
    jobid = await denops.call("termopen", ...args) as number;
  } else {
    const shell = await denops.call("eval", "&shell");
    const args = [[shell, "-c", cmd.join(" ")]] as unknown[];
    if (callback) {
      args.push({ exit_cb: "gh#_vim_on_exit_terminal" });
    }

    jobid = await denops.call(`term_start`, ...args) as number;
    await denops.cmd(`nnoremap <buffer> <silent> <CR> :bw<CR>`);
  }

  if (callback) {
    const fn = `on_exit_terminal_${jobid}`;
    denops.dispatcher[fn] = async (
      exitCode: unknown,
    ): Promise<void> => {
      try {
        ensureNumber(exitCode);
        await callback(denops, exitCode);
      } catch (e) {
        console.error(e.message);
      } finally {
        delete denops.dispatcher[fn];
      }
    };
  }
}

export const vimRegister = Deno.build.os === "darwin" ? "*" : "+";

export const inprogress = async <T>(
  denops: Denops,
  text: string,
  f: () => Promise<void | T>,
) => {
  try {
    console.log(text);
    return await f();
  } finally {
    await denops.cmd("echo ''");
  }
};

export function trim(word: string, pat?: string): string {
  if (!pat) {
    return word.trim();
  }
  if (word && word.at(0) === pat) {
    word = word.substring(1);
  }
  if (word && word.at(-1) === pat) {
    word = word.substring(0, word.length - 1);
  }
  return word;
}

export async function getSelectedIdxs(denops: Denops): Promise<number[]> {
  const signInfo = await denops.eval(
    `sign_getplaced(bufname(), {'group': 'gh'})`,
  ) as [{ signs: [{ lnum: number }] }];

  const idxs = signInfo[0].signs.length
    ? signInfo.map((signs) => {
      return signs.signs[0].lnum - 1;
    })
    : [(await denops.call("line", ".") as number) - 1];
  return idxs;
}
