import { query } from "./api.ts";
import { GetIssueTemplates, GetUsers, IssueTemplate, User } from "./schema.ts";

export async function getIssueTemplate(args: {
  endpoint?: string;
  repo: {
    owner: string;
    name: string;
  };
}): Promise<IssueTemplate[]> {
  const q = `
{
  repository(owner: "${args.repo.owner}", name: "${args.repo.name}") {
    issueTemplates {
      name
      body
    }
  }
}
`;
  const resp = await query<GetIssueTemplates>(
    {
      endpoint: args.endpoint,
      query: q,
    },
  );

  const t = resp.data.repository.issueTemplates.map((t) => {
    t.body = t.body.replace(/\n/g, "\n");
    return t;
  });
  return t;
}

export async function getMentionableUsers(args: {
  endpoint?: string;
  repo: {
    owner: string;
    name: string;
  };
  word: string;
}): Promise<User[]> {
  const q = `
{
  repository(owner: "${args.repo.owner}", name: "${args.repo.name}") {
    mentionableUsers(first: 10, query: "${args.word}") {
      nodes {
        login
        bio
      }
    }
  }
}
`;

  const resp = await query<GetUsers>(
    {
      endpoint: args.endpoint,
      query: q,
    },
  );

  return resp.data.repository.mentionableUsers.nodes;
}
