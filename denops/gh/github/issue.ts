import { IssueFilters, ResultIssue } from "./schema.ts";
import { query } from "./api.ts";

export interface QueryIssues {
  data: {
    search: ResultIssue;
  };
}

export type IssueFilter = {
  endpoint?: string;
  after?: string;
  owner: string;
  name: string;
  Filter?: IssueFilters;
};

export async function getIssues(
  req: IssueFilter,
): Promise<ResultIssue> {
  // default query
  const filter: string[] = [
    `repo:${req.owner}/${req.name}`,
    `type:issue`,
  ];

  if (req.Filter) {
    if (req.Filter.labels) {
      filter.push(...req.Filter.labels.map((v) => {
        return `label:${v}`;
      }));
    }

    if (req.Filter.states) {
      filter.push(...req.Filter.states.map((v) => {
        return `state:${v}`;
      }));
    } else {
      filter.push("state:OPEN");
    }

    if (req.Filter.assignees) {
      filter.push(...req.Filter.assignees.map((v) => {
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
    endpoint: req.endpoint,
    query: q,
  });
  return json.data.search;
}
