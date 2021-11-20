import { onece } from "../utils/helper.ts";

export type Repository = {
  Owner: string;
  Name: string;
};

const dec = new TextDecoder();

export const getRepo = onece(readRepo);

export async function readRepo(): Promise<Repository> {
  const opt: Deno.RunOptions = {
    cmd: ["git", "remote", "get-url", "--push", "origin"],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  };
  const p = Deno.run(opt);
  const [status, stdout, stderr] = await Promise.all([
    p.status(),
    p.output(),
    p.stderrOutput(),
  ]);

  if (!status.success) {
    p.stdout?.close();
    p.stderr?.close();
    p.close();

    throw new Error(
      stderr
        ? dec.decode(stderr)
        : "there has some error occurs when get current repository info",
    );
  }

  const out = dec.decode(stdout).trim();
  const repo = parseRemote(out);
  p.close();
  return repo;
}

export function parseRemote(text: string): Repository {
  const idx = text.lastIndexOf(".git");
  const remote = (idx === -1) ? text : text.substring(0, idx);
  if (!remote) {
    throw new Error(`invalid remote: '${remote}'`);
  }

  const ownerRepo: string[] = [];
  if (remote.startsWith("ssh")) {
    const p = remote.split("/");
    if (!p.length) {
      throw new Error(`invalid remote: '{text}'`);
    }
    ownerRepo.push(...p.splice(-2));
  } else if (remote.startsWith("git")) {
    const p = remote.split(":");
    if (!p.length) {
      throw new Error(`invalid remote: '{text}'`);
    }
    ownerRepo.push(...p[1].split("/"));
  } else if (remote.startsWith("http") || remote.startsWith("https")) {
    const p = remote.split("/");
    if (!p.length) {
      throw new Error(`invalid remote: '{text}'`);
    }
    ownerRepo.push(...p.splice(-2));
  }

  const repo = {
    Owner: ownerRepo[0],
    Name: ownerRepo[1],
  };
  return repo;
}
