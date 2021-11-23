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

export async function getPRWithCommitHash(
  req: { endpoint: string; owner?: string; name?: string; commit: string },
): Promise<string> {
  const curp = await getRepo();
  req.owner = req.owner || curp.Owner;
  req.name = req.name || curp.Name;

  const q = `
query {
  repository(owner: "${req.owner}", name: "${req.name}"){
    object(expression: "${req.commit}"){
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
    endpoint: req.endpoint,
    query: q,
  });

  if (!resp.data.repository.object) {
    console.error(resp);
    throw new Error("not found pull request");
  }

  const nodes = resp.data.repository.object.associatedPullRequests.nodes;
  if (!nodes || !nodes.length) {
    throw new Error("not found pull request");
  }
  return nodes[0]?.url;
}
