import * as Types from './types.ts';

export type IssueBodyFragment = { id: string, title: string, body: string, closed: boolean, number: number, url: any, state: Types.IssueState, author?: { login: string }, assignees: { nodes?: Array<UserFragment> }, labels?: { nodes?: Array<LabelBodyFragment> }, repository: { name: string }, comments: { nodes?: Array<{ id: string }> } };

export type GetIssueQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  repo: Types.Scalars['String'];
  number: Types.Scalars['Int'];
}>;


export type GetIssueQuery = { repository?: { issue?: IssueBodyFragment } };

export type GetIssuesQueryVariables = Types.Exact<{
  first: Types.Scalars['Int'];
  filter: Types.Scalars['String'];
}>;


export type GetIssuesQuery = { search: { nodes?: Array<IssueBodyFragment> } };

export type UpdateIssueMutationVariables = Types.Exact<{
  id: Types.Scalars['ID'];
  title?: Types.InputMaybe<Types.Scalars['String']>;
  state?: Types.InputMaybe<Types.IssueState>;
  body?: Types.InputMaybe<Types.Scalars['String']>;
  labelIds?: Types.InputMaybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>;
  assigneeIds?: Types.InputMaybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>;
}>;


export type UpdateIssueMutation = { updateIssue?: { issue?: IssueBodyFragment } };

export type IssueCommentFragment = { nodes?: Array<{ databaseId?: number, url: any, body: string, author?: { login: string } }>, pageInfo: { startCursor?: string, endCursor?: string } };

export type GetIssueCommentsQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  number: Types.Scalars['Int'];
}>;


export type GetIssueCommentsQuery = { repository?: { issue?: { comments: IssueCommentFragment } } };

export type IssueTemplateBodyFragment = { name: string, body?: string };

export type GetIssueTemplatesQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
}>;


export type GetIssueTemplatesQuery = { repository?: { issueTemplates?: Array<IssueTemplateBodyFragment> } };

export type GetMentionableUsersQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  word: Types.Scalars['String'];
}>;


export type GetMentionableUsersQuery = { repository?: { mentionableUsers: { nodes?: Array<UserFragment> } } };

export type GetAssignableUsersQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  word: Types.Scalars['String'];
}>;


export type GetAssignableUsersQuery = { repository?: { assignableUsers: { nodes?: Array<UserFragment> } } };

export type LabelBodyFragment = { name: string, color: string, description?: string };

export type SearchLabelsQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  word: Types.Scalars['String'];
}>;


export type SearchLabelsQuery = { repository?: { labels?: { nodes?: Array<LabelBodyFragment> } } };

export type UserFragment = { id: string, login: string, name?: string, bio?: string };

export type SearchUsersQueryVariables = Types.Exact<{
  user: Types.Scalars['String'];
}>;


export type SearchUsersQuery = { search: { nodes?: Array<UserFragment> } };
