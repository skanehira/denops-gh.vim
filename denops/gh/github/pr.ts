import { getRepo } from "../utils/git.ts";
import { query } from "./api.ts";
import { PullRequestConnection } from "./schema.ts";

type AssociatedPullRequests = {
  data: {
    repository: {
      object?: {
        associatedPullRequests: PullRequestConnection;
      };
    };
  };
};

export async function getAssociatedPullRequest(
  endpoint: string,
  cond: { owner?: string; name?: string; commit: string },
): Promise<string> {
  const curp = await getRepo();
  cond.owner = cond.owner || curp.Owner;
  cond.name = cond.name || curp.Name;

  const q = `
query {
  repository(owner: "${cond.owner}", name: "${cond.name}"){
    object(expression: "${cond.commit}"){
      ... on Commit {
        associatedPullRequests(first: 1){
          nodes {
            title
            url
            state
            number
          }
        }
      }
    }
  }
}`;

  const resp = await query<AssociatedPullRequests>({
    endpoint: endpoint,
    query: q,
  });

  if (!resp.data.repository.object) {
    console.error("query: ", q);
    console.error("resp: ", resp);
    throw new Error("not found pull request");
  }

  const nodes = resp.data.repository.object.associatedPullRequests.nodes;
  if (!nodes || !nodes.length) {
    throw new Error("not found pull request");
  }
  return nodes[0]?.url;
}
