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

export const isIssueItem = (arg: unknown): arg is IssueBodyFragment => {
  return ["id", "title", "author", "number", "closed"].some((v) =>
    v in (arg as Record<string, unknown>)
  );
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
