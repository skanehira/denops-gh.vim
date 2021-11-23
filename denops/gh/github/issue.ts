import { IssueFilters, ResultIssue } from "./schema.ts";
import { query } from "./api.ts";

export interface QueryIssues {
  data: {
    search: ResultIssue;
  };
}

export type IssueCondition = {
  after?: string;
  owner: string;
  name: string;
  Filter?: IssueFilters;
};

export async function getIssues(
  endpoint: string,
  cond: IssueCondition,
): Promise<ResultIssue> {
  // default query
  const filter: string[] = [
    `repo:${cond.owner}/${cond.name}`,
    `type:issue`,
  ];

  if (cond.Filter) {
    if (cond.Filter.labels) {
      filter.push(...cond.Filter.labels.map((v) => {
        return `label:${v}`;
      }));
    }

    if (cond.Filter.states) {
      filter.push(...cond.Filter.states.map((v) => {
        return `state:${v}`;
      }));
    } else {
      filter.push("state:OPEN");
    }

    if (cond.Filter.assignees) {
      filter.push(...cond.Filter.assignees.map((v) => {
        return `assignee:${v}`;
      }));
    }
  } else {
    filter.push("state:OPEN");
  }

  const q = `
  {
    search(first: 10, type: ISSUE, query: "${filter.join(" ")}") {
      nodes {
        ... on Issue {
          title,
          author{
            login
          },
          assignees(first: 10) {
            nodes {
              login
            }
          },
          body,
          labels(first: 10) {
            nodes {
              name,
              color
            }
          },
          closed,
          number,
          repository {
            name,
          }
          url,
          state,
        }
      },
      pageInfo{
        hasNextPage,
        startCursor,
        endCursor
      }
    }
  }`;

  const json = await query<QueryIssues>({
    endpoint: endpoint,
    query: q,
  });
  return json.data.search;
}
