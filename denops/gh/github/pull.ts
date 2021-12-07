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

export type PRCondition = {
  owner?: string;
  name?: string;
  commit: string;
};

export async function getAssociatedPullRequest(
  args: {
    endpoint?: string;
    cond: PRCondition;
  },
): Promise<string> {
  const currentRepo = await getRepo();
  args.cond.owner = args.cond.owner || currentRepo.Owner;
  args.cond.name = args.cond.name || currentRepo.Name;

  const q = `
query {
  repository(owner: "${args.cond.owner}", name: "${args.cond.name}"){
    object(expression: "${args.cond.commit}"){
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
}
`;

  const resp = await query<AssociatedPullRequests>({
    endpoint: args.endpoint,
    query: q,
  });

  if (!resp.data.repository.object) {
    throw new Error("not found pull request");
  }

  const nodes = resp.data.repository.object.associatedPullRequests.nodes;
  if (!nodes || !nodes.length) {
    throw new Error("not found pull request");
  }
  return nodes[0]?.url;
}
