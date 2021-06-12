import { query } from "./api.ts";
import { Issue } from "./schema.ts";

export interface Query {
  Name: string;
  Owner: string;
  Type: "ISSUE" | "REPOSITORY";
}

export interface QueryIssues {
  data: {
    search: {
      nodes: Issue[];
    };
  };
}

export async function getIssues(
  endpoint: string,
  repo: any,
): Promise<Issue[]> {
  const q = `
  {
    search(first: 30, type: ISSUE, query: "repo:${repo.Owner}/${repo.Name} is:ISSUE is:OPEN") {
      nodes {
        ... on Issue {
          title
        }
      }
    }
  }
  `;

  const json = await query<QueryIssues>(endpoint, q);
  return json.data.search.nodes;
}
