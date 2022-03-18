import { IssueItem, ResultIssue, UpdateIssueInput } from "./schema.ts";
import { mutation, query } from "./api.ts";
import { safe_string } from "../deps.ts";

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
  Filter?: string;
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
      id
      login
      name
      bio
    }
  }
  body
  labels(first: 20) {
    nodes {
      name
      color
      description
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
    filter.push(args.cond.Filter.replaceAll('"', '\\"'));
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
  json.data.search.nodes = json.data.search.nodes.map((issue) => {
    issue.body = issue.body.replaceAll("\r\n", "\n");
    return issue;
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
  json.data.repository.issue.body = json.data.repository.issue.body.replaceAll(
    "\r\n",
    "\n",
  );
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
    ${
    args.input.body
      ? "body:" + `"${safe_string.escape(args.input.body, "`")}"`
      : ""
  }
    ${args.input.state ? "state:" + args.input.state : ""}
    ${
    args.input.assignees
      ? "assigneeIds:" + `${JSON.stringify(args.input.assignees)}`
      : ""
  }
    ${
    args.input.labels
      ? "labelIds:" + `${JSON.stringify(args.input.labels)}`
      : ""
  }
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
