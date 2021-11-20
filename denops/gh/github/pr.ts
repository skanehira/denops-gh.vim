import { getRepo } from "../utils/git.ts";
import { query } from "./api.ts";
import { PullRequestConnection } from "./schema.ts";

type AssociatedPullRequests = {
  data: {
    repository: {
      object: {
        associatedPullRequests: PullRequestConnection;
      };
    };
  };
};

export async function getPRWithCommitHash(
  repo: { owner?: string; name?: string; commit: string },
): Promise<string> {
  const curp = await getRepo();
  repo.owner = repo.owner || curp.Owner;
  repo.name = repo.name || curp.Name;

  const q = `
query {
  repository(owner: "${repo.owner}", name: "${repo.name}"){
    object(expression: "${repo.commit}"){
      ... on Commit {
        associatedPullRequests(first: 1){
          nodes {
            title
            url
          }
        }
      }
    }
  }
}`;

  const resp = await query<AssociatedPullRequests>({
    query: q,
  });

  const nodes = resp.data.repository.object.associatedPullRequests.nodes;
  if (!nodes || !nodes.length) {
    throw new Error("not found pull request");
  }
  return nodes[0]?.url;
}
