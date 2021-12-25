export type Actor = {
  login: string;
  url: string;
};

export type Team = {
  name: string;
};

export type TeamConnection = {
  nodes: Team[];
};

export type Organization = {
  name: string;
  teams: TeamConnection;
};

export type OrganizationConnection = {
  nodes: Organization[];
};

export type User = {
  id: string;
  login: string;
  bio?: string;
};

export type GetUsers = {
  data: {
    repository: {
      mentionableUsers: {
        nodes: User[];
      };
    };
  };
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

export type IssueComment = {
  id: string;
  body?: string;
};

export type IssueCommentConnection = {
  nodes: IssueComment[];
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
  comments: IssueCommentConnection;
};

export const isIssueItem = (arg: unknown): arg is IssueItem => {
  return ["id", "title", "author", "number", "closed"].some((v) =>
    v in (arg as Record<string, unknown>)
  );
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

export type IssueTemplate = {
  name: string;
  body: string;
};

export type GetIssueTemplates = {
  data: {
    repository: {
      issueTemplates: IssueTemplate[];
    };
  };
};
