import { request } from "./api.ts";
import { GetLabels } from "./schema.ts";
import {
  GetAssignableUsersQuery,
  GetAssignableUsersQueryVariables,
  GetIssueTemplatesQuery,
  GetIssueTemplatesQueryVariables,
  GetMentionableUsersQuery,
  GetMentionableUsersQueryVariables,
  IssueTemplateBodyFragment,
  LabelBodyFragment,
  SearchLabelsQuery,
  SearchLabelsQueryVariables,
  UserFragment,
} from "./graphql/operations.ts";
import { fragmentUser } from "./user.ts";

const fragmentIssueTemplateBody = `
fragment issueTemplateBody on IssueTemplate {
  name
  body
}
`;

const queryGetIssueTemplates = `
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

const queryGetMentionableUsers = `
${fragmentUser}

query getMentionableUsers($owner: String!, $name: String!, $word: String!) {
  repository(owner: $owner, name: $name) {
    mentionableUsers(first: 10, query: $word) {
      nodes {
        ... user
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
}): Promise<UserFragment[]> {
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

const queryGetAssignableUsers = `
${fragmentUser}

query getAssignableUsers($owner: String!, $name: String!, $word: String!) {
  repository(owner: $owner, name: $name) {
    assignableUsers(first: 10, query: $word) {
      nodes {
        ... user
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
}): Promise<UserFragment[]> {
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

export const fragmentLabelBody = `
fragment labelBody on Label {
  name
  color
  description
}
`;

const querySearchLabels = `
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
