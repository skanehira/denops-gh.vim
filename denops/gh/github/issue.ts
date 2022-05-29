import { octokit, request } from "./api.ts";
import { gql } from "../deps.ts";
import {
  GetIssueCommentsQuery,
  GetIssueCommentsQueryVariables,
  GetIssueQuery,
  GetIssueQueryVariables,
  GetIssuesQuery,
  GetIssuesQueryVariables,
  IssueBodyFragment,
  UpdateIssueMutation,
  UpdateIssueMutationVariables,
} from "./graphql/operations.ts";

function ensureNonEmptyIssue(
  issue: Record<never, never>,
): issue is IssueBodyFragment {
  return Object.keys(issue).length > 0;
}

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

query getIssues($first: Int!, $filter: String!) {
  search(first: $first, type: ISSUE, query: $filter) {
    nodes {
      ... on Issue {
        ...issueBody
      }
    }
  }
}
`;

export type GetIssuesCondition = {
  first?: number;
  owner: string;
  name: string;
  Filter?: string;
};

export async function getIssues(
  args: {
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
    queryGetIssues,
    {
      first: first,
      filter: filter.join(" "),
    },
  );

  if (!resp.search.nodes) {
    return [];
  }

  const issues = resp.search.nodes.filter(ensureNonEmptyIssue).map((issue) => {
    issue.body = issue.body.replaceAll("\r\n", "\n");
    return issue;
  });

  return issues;
}

export async function getIssue(
  args: {
    cond: GetIssueQueryVariables;
  },
): Promise<IssueBodyFragment> {
  const resp = await request<GetIssueQuery, GetIssueQueryVariables>(
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
    input: UpdateIssueMutationVariables;
  },
): Promise<IssueBodyFragment> {
  const resp = await request<UpdateIssueMutation, UpdateIssueMutationVariables>(
    updateIssueMutation,
    {
      id: args.input.id,
      title: args.input.title,
      assigneeIds: args.input.assigneeIds,
      labelIds: args.input.labelIds,
      body: args.input.body,
      state: args.input.state,
    },
  );

  if (!resp.updateIssue?.issue) {
    throw new Error(`not found issue: ${args.input.id}`);
  }

  return resp.updateIssue.issue;
}

export async function getIssueComment(args: {
  owner: string;
  repo: string;
  id: number;
}) {
  const resp = await octokit.rest.issues.getComment({
    owner: args.owner,
    repo: args.repo,
    comment_id: args.id,
  });
  if (resp.status >= 300) {
    throw new Error(resp.message);
  }
  return resp.data;
}

export async function updateIssueComment(args: {
  owner: string;
  repo: string;
  id: number;
  body: string;
}) {
  const resp = await octokit.rest.issues.updateComment({
    owner: args.owner,
    repo: args.repo,
    comment_id: args.id,
    body: args.body,
  });
  if (resp.status >= 300) {
    throw new Error(resp.message);
  }
  return resp;
}

const fragmentIssueComment = gql`
fragment issueComment on IssueCommentConnection {
  nodes {
    databaseId
    author {
      login
    }
    body
  }
  pageInfo {
    startCursor
    endCursor
  }
}
`;

const queryGetIssueComments = gql`
${fragmentIssueComment}

query getIssueComments($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      comments(first:100) {
        ... issueComment
      }
    }
  }
}
`;

export async function getIssueComments(args: {
  owner: string;
  name: string;
  number: number;
}) {
  const resp = await request<
    GetIssueCommentsQuery,
    GetIssueCommentsQueryVariables
  >(queryGetIssueComments, {
    owner: args.owner,
    name: args.name,
    number: args.number,
  });

  if (!resp.repository?.issue?.comments) {
    return {
      nodes: [],
      pageInfo: null,
    };
  }

  return resp.repository.issue.comments;
}
