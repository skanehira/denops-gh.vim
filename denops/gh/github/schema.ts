export type Actor = {
  login: string;
  url: string;
};

export type User = {
  id: string;
  login: string;
};

export type UserConnection = {
  nodes: User[];
};

export type Label = {
  name: string;
  color: string;
};

export type LabelConnection = {
  nodes: Label[];
};

export type Repository = {
  name: string;
};

export type IssueItem = {
  __typename?: "Issue";
  id: string;
  title: string;
  author: Actor;
  assignees: UserConnection;
  body: string;
  labels: LabelConnection;
  closed: boolean;
  number: number;
  repository: Repository;
  url: string;
  state: "OPEN" | "CLOSED" | "MERGED";
};

export type PageInfo = {
  __typename?: "PageInfo";
  endCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
};

export type ResultIssue = {
  nodes: IssueItem[];
  pageInfo: PageInfo;
};

export type State = "open" | "closed";

export type IssueFilters = {
  labels?: string[];
  states?: State[];
  assignees?: string[];
  title?: string;
};

export type PullRequest = {
  title: string;
  url: string;
};

export type PullRequestConnection = {
  nodes: PullRequest[];
};

export type UpdateIssueInput = {
  id: string;
  title?: string;
  state?: "OPEN" | "CLOSED";
  body?: string;
  labels?: string[];
  assignees?: string[];
};
