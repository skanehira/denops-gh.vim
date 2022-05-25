import { IssueItem, ResultIssue, UpdateIssueInput } from "./schema.ts";
import { endpoint, request } from "./api.ts";
import { gql } from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";
import {
  GetIssueQuery,
  GetIssueQueryVariables,
  GetIssuesQuery,
  GetIssuesQueryVariables,
  IssueBodyFragment,
  UpdateIssueMutation,
  UpdateIssueMutationVariables,
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

const updateIssueMutation = gql`
${fragmentIssueBody}

mutation UpdateIssue($id: ID!, $title: String, $state: IssueState, $body: String, $labelIds: [ID!], $assigneeIds: [ID!]){
  updateIssue(input: {
    id: $id,
    title: $title,
    state: $state,
    body: $body,
    labelIds: $labelIds,
    assigneeIds: $assigneeIds
  }) {
    issue {
      ...issueBody
    }
  }
}
`;

export async function updateIssue(
  args: {
    endpoint?: string;
    input: UpdateIssueInput;
  },
): Promise<IssueBodyFragment> {
  const resp = await request<UpdateIssueMutation, UpdateIssueMutationVariables>(
    args.endpoint ?? endpoint,
    updateIssueMutation,
    {
      id: args.input.id,
      title: args.input.title,
      assigneeIds: args.input.assignees,
      labelIds: args.input.labels,
      body: args.input.body,
      state: args.input.state,
    },
  );

  if (!resp.updateIssue?.issue) {
    throw new Error(`not found issue: ${args.input.id}`);
  }

  return resp.updateIssue.issue;
}
