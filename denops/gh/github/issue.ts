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
  comments(first: 10) {
    nodes{
      id
    }
  }
`;

export async function getIssues(
  args: {
    endpoint?: string;
    cond: GetIssuesCondition;
  },
): Promise<ResultIssue> {
  // default query
  const filter: string[] = [
    `repo:${args.cond.owner}/${args.cond.name}`,
    `type:issue`,
  ];

  const first = `first: ${args.cond.first ? args.cond.first : 10}`;

  if (args.cond.Filter) {
    if (args.cond.Filter.labels) {
      filter.push(...args.cond.Filter.labels.map((v) => {
        return `label:${v}`;
      }));
    }

    if (args.cond.Filter.states) {
      filter.push(...args.cond.Filter.states.map((v) => {
        return `state:${v}`;
      }));
    } else {
      filter.push("state:open");
    }

    if (args.cond.Filter.assignees) {
      filter.push(...args.cond.Filter.assignees.map((v) => {
        return `assignee:${v}`;
      }));
    }

    if (args.cond.Filter.title) {
      filter.push(`${args.cond.Filter.title} in:title`);
    }
  } else {
    filter.push("state:open");
  }

  const q = `
  {
    search(${first}, type: ISSUE, query: "${filter.join(" ")}") {
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
    endpoint: args.endpoint,
    query: q,
  });
  return json.data.search;
}

export async function getIssue(
  args: {
    endpoint?: string;
    cond: GetIssueCondition;
  },
): Promise<IssueItem> {
  const q = `
  {
    repository(owner: "${args.cond.owner}", name: "${args.cond.repo}") {
      issue(number: ${args.cond.number}) {
        ${issueBodyQuery}
      }
    }
  }
  `;
  const json = await query<GetIssueResult>({
    endpoint: args.endpoint,
    query: q,
  });
  if (!json.data.repository.issue) {
    throw new Error(`not found issue number: ${args.cond.number}`);
  }
  return json.data.repository.issue;
}

export async function updateIssue(
  args: {
    endpoint?: string;
    input: UpdateIssueInput;
  },
): Promise<IssueItem> {
  // TODO update others fields
  const q = `
  updateIssue(input: {
    id: "${args.input.id}"
    ${args.input.title ? "title:" + args.input.title : ""}
    ${args.input.body ? "body:" + `"${args.input.body}"` : ""}
    ${args.input.state ? "state:" + args.input.state : ""}
  }) {
    issue {
      ${issueBodyQuery}
    }
  }`;

  const json = await mutation<{ data: { updateIssue: { issue: IssueItem } } }>({
    endpoint: args.endpoint,
    input: q,
  });
  return json.data.updateIssue.issue;
}
