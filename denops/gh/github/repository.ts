import { request } from "./api.ts";
import { GetLabels } from "./schema.ts";
import { gql } from "../deps.ts";
import {
  AssignableUserFragment,
  GetAssignableUsersQuery,
  GetAssignableUsersQueryVariables,
  GetIssueTemplatesQuery,
  GetIssueTemplatesQueryVariables,
  GetMentionableUsersQuery,
  GetMentionableUsersQueryVariables,
  IssueTemplateBodyFragment,
  LabelBodyFragment,
  MentionableUserFragment,
  SearchLabelsQuery,
  SearchLabelsQueryVariables,
} from "./graphql/operations.ts";

const fragmentIssueTemplateBody = gql`
fragment issueTemplateBody on IssueTemplate {
  name
  body
}
`;

const queryGetIssueTemplates = gql`
${fragmentIssueTemplateBody}

query getIssueTemplates($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    issueTemplates {
      ... issueTemplateBody
    }
  }
}
`;

export async function getIssueTemplate(args: {
  repo: {
    owner: string;
    name: string;
  };
}): Promise<Required<IssueTemplateBodyFragment>[]> {
  const resp = await request<
    GetIssueTemplatesQuery,
    GetIssueTemplatesQueryVariables
  >(
    queryGetIssueTemplates,
    args.repo,
  );

  if (!resp.repository?.issueTemplates) {
    return [];
  }

  const templates = resp.repository.issueTemplates.filter((
    template,
  ): template is Required<IssueTemplateBodyFragment> =>
    template.body ? true : false
  )
    .map(
      (template) => {
        template.body = template.body.replace(/\n/g, "\n");
        return template;
      },
    );
  return templates;
}

const fragmentMentionableUser = gql`
fragment mentionableUser on User {
  login
  name
  bio
}
`;

const queryGetMentionableUsers = gql`
${fragmentMentionableUser}

query getMentionableUsers($owner: String!, $name: String!, $word: String!) {
  repository(owner: $owner, name: $name) {
    mentionableUsers(first: 10, query: $word) {
      nodes {
        ... mentionableUser
      }
    }
  }
}
`;

export async function getMentionableUsers(args: {
  repo: {
    owner: string;
    name: string;
  };
  word: string;
}): Promise<MentionableUserFragment[]> {
  const resp = await request<
    GetMentionableUsersQuery,
    GetMentionableUsersQueryVariables
  >(queryGetMentionableUsers, {
    owner: args.repo.owner,
    name: args.repo.name,
    word: args.word,
  });

  if (!resp.repository?.mentionableUsers.nodes) {
    return [];
  }

  return resp.repository.mentionableUsers.nodes;
}

const fragmentAssignableUser = gql`
fragment assignableUser on User {
  login
  name
  bio
}
`;

const queryGetAssignableUsers = gql`
${fragmentAssignableUser}

query getAssignableUsers($owner: String!, $name: String!, $word: String!) {
  repository(owner: $owner, name: $name) {
    assignableUsers(first: 10, query: $word) {
      nodes {
        ... assignableUser
      }
    }
  }
}
`;

export async function getAssignableUsers(args: {
  repo: {
    owner: string;
    name: string;
  };
  word: string;
}): Promise<AssignableUserFragment[]> {
  const resp = await request<
    GetAssignableUsersQuery,
    GetAssignableUsersQueryVariables
  >(queryGetAssignableUsers, {
    owner: args.repo.owner,
    name: args.repo.name,
    word: args.word,
  });

  if (!resp.repository?.assignableUsers.nodes) {
    return [];
  }

  return resp.repository.assignableUsers.nodes;
}

const fragmentLabelBody = gql`
fragment labelBody on Label {
  name
  color
  description
}
`;

const querySearchLabels = gql`
${fragmentLabelBody}

query searchLabels($owner: String!, $name: String!, $word: String!) {
  repository(owner: $owner, name: $name) {
    labels(first: 10, query: $word) {
      nodes {
        ... labelBody
      }
    }
  }
}
`;

export async function searchLabels(args: {
  repo: {
    owner: string;
    name: string;
  };
  word: string;
}): Promise<LabelBodyFragment[]> {
  const resp = await request<SearchLabelsQuery, SearchLabelsQueryVariables>(
    querySearchLabels,
    {
      owner: args.repo.owner,
      name: args.repo.name,
      word: args.word,
    },
  );

  if (!resp.repository?.labels?.nodes) {
    return [];
  }

  return resp.repository.labels.nodes;
}

export async function getLabels(args: {
  repo: {
    owner: string;
    name: string;
  };
  labels: string[];
}): Promise<GetLabels> {
  const labels = args.labels.map((label, i) => {
    return `label${i}: repository(owner:"${args.repo.owner}", name:"${args.repo.name}") {
    label(name: "${label}"){
      ...LabelFragment
    }
  }`;
  });
  const query = `
query {
  ${labels.join("\n")}
}

fragment LabelFragment on Label{
  id
  name
}
  `;

  const resp = await request<GetLabels>(query);
  return resp;
}
