import { query } from "./api.ts";
import { GetUsers, User } from "./schema.ts";

export async function getUsers(args: {
  endpoint?: string;
  word: string;
}): Promise<User[]> {
  const q = `
{
  search(type: USER, query: "${args.word}", first: 10) {
    nodes{
      ... on User{
        id
        login
        name
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

  return resp.data.search.nodes;
}
