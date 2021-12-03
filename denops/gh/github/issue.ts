import {
  IssueFilters,
  IssueItem,
  ResultIssue,
  UpdateIssueInput,
} from "./schema.ts";
import { mutation, query } from "./api.ts";

export type GetIssuesResult = {
  data: {
    search: ResultIssue;
  };
};

export type GetIssuesCondition = {
  first?: number;
  after?: string;
  owner: string;
  name: string;
  Filter?: IssueFilters;
};

export type GetIssueResult = {
  data: {
    repository: {
      issue: IssueItem;
    };
  };
};

export type GetIssueCondition = {
  owner: string;
  repo: string;
  number: number;
};

const issueBodyQuery = `
  id
  title
  author {
    login
  }
  assignees(first: 10) {
    nodes {
      login
    }
  }
  body
  labels(first: 10) {
    nodes {
      name
      color
    }
  }
  closed
  number
  repository {
    name
  }
  url
  state
`;

export async function getIssues(
  endpoint: string,
  cond: GetIssuesCondition,
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
          ${issueBodyQuery}
        }
      },
      pageInfo{
        hasNextPage,
        startCursor,
        endCursor
      }
    }
  }`;

  const json = await query<GetIssuesResult>({
    endpoint: endpoint,
    query: q,
  });
  return json.data.search;
}

export async function getIssue(
  endpoint: string,
  cond: GetIssueCondition,
): Promise<IssueItem> {
  const q = `
  {
    repository(owner: "${cond.owner}", name: "${cond.repo}") {
      issue(number: ${cond.number}) {
        ${issueBodyQuery}
      }
    }
  }
  `;
  const json = await query<GetIssueResult>({
    endpoint: endpoint,
    query: q,
  });
  if (!json.data.repository.issue) {
    throw new Error(`not found issue number: ${cond.number}`);
  }

  return json.data.repository.issue;
}

export async function updateIssue(
  endpoint: string,
  input: UpdateIssueInput,
): Promise<IssueItem> {
  // TODO update others fields
  const q = `
  updateIssue(input: {
    id: "${input.id}"
    ${input.title ? "title:" + input.title : ""}
    ${input.body ? "body:" + `"${input.body}"` : ""}
    ${input.state ? "state:" + input.state : ""}
  }) {
    issue {
      ${issueBodyQuery}
    }
  }`;

  const json = await mutation<{ data: { updateIssue: { issue: IssueItem } } }>({
    endpoint: endpoint,
    input: q,
  });
  return json.data.updateIssue.issue;
}
