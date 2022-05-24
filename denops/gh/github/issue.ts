import { IssueItem, ResultIssue, UpdateIssueInput } from "./schema.ts";
import { endpoint, mutation, query, request } from "./api.ts";
import { safe_string } from "../deps.ts";
import { gql } from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";
import {
  GetIssueQuery,
  GetIssueQueryVariables,
  GetIssuesQuery,
  GetIssuesQueryVariables,
  IssueBodyFragment,
} from "./graphql/operations.ts";

const fragmentIssueBody = gql`
fragment issueBody on Issue {
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
}
`;

const queryGetIssue = gql`
${fragmentIssueBody}

query getIssue($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $number) {
      ...issueBody
    }
  }
}
`;

const queryGetIssues = gql`
${fragmentIssueBody}

query getIssues($first: Int!, $query: String!) {
  search(first: $first, type: ISSUE, query: $query) {
    nodes {
      ... on Issue {
        ...issueBody
      }
    }
  }
}
`;

export type GetIssuesResult = {
  data: {
    search: ResultIssue;
  };
};

export type GetIssuesCondition = {
  first?: number;
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
): Promise<IssueBodyFragment[]> {
  const filter: string[] = [
    `repo:${args.cond.owner}/${args.cond.name}`,
    `type:issue`,
  ];

  const first = args.cond.first ?? 10;
  filter.push(args.cond.Filter ?? "state:open");

  const resp = await request<GetIssuesQuery, GetIssuesQueryVariables>(
    args.endpoint ?? endpoint,
    queryGetIssues,
    {
      first: first,
      query: filter.join(" "),
    },
  );

  if (!resp.search.nodes) {
    return [];
  }

  const issues = resp.search.nodes.filter((issue): issue is IssueBodyFragment =>
    issue !== null && issue !== undefined && Object.keys(issue).length > 0
  ).map((issue) => {
    issue.body = issue.body.replaceAll("\r\n", "\n");
    return issue;
  });

  return issues;
}

export async function getIssue(
  args: {
    endpoint?: string;
    cond: GetIssueCondition;
  },
): Promise<IssueBodyFragment> {
  const resp = await request<GetIssueQuery, GetIssueQueryVariables>(
    args.endpoint ?? endpoint,
    queryGetIssue,
    {
      repo: args.cond.repo,
      owner: args.cond.owner,
      number: args.cond.number,
    },
  );

  if (!resp.repository?.issue) {
    throw new Error(`not found issue number: ${args.cond.number}`);
  }

  resp.repository.issue.body = resp.repository.issue.body.replaceAll(
    "\r\n",
    "\n",
  );
  return resp.repository.issue;
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
    ${args.input.title ? "title:" + `"${args.input.title}"` : ""}
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
