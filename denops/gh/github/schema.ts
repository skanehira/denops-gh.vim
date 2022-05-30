import { IssueBodyFragment } from "./graphql/operations.ts";

export type Errors = [
  {
    type: string;
    message: string;
  },
];

export type GetLabels = {
  [key: string]: {
    label: {
      id: string;
      name: string;
    };
  };
};

export const isIssueBody = (arg: unknown): arg is IssueBodyFragment => {
  return ["id", "title", "author", "number", "closed"].some((v) =>
    v in (arg as Record<string, unknown>)
  );
};

export type IssueComment = {
  url: string;
  html_url: string;
  issue_url: string;
  id: number;
  node_id: string;
  user: User;
  created_at: string;
  updated_at: string;
  author_association: string;
  body: string;
  reactions: Reactions;
  performed_via_github_app?: null;
};

type User = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
};

type Reactions = {
  url: string;
  total_count: number;
  "+1": number;
  "-1": number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
};

export const isIssueComment = (arg: unknown): arg is IssueComment => {
  return "body" in (arg as Record<string, string>);
};

export type PullRequest = {
  title: string;
  url: string;
};

export type PullRequestConnection = {
  nodes: PullRequest[];
};

export type GetUsers = {
  [key: string]: {
    login: string;
    id: string;
  };
};
