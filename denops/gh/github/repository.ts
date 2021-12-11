import { query } from "./api.ts";
import { GetIssueTemplates, IssueTemplate } from "./schema.ts";

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
