import { query } from "./api.ts";
import { GetUsers, SearchUsers, User } from "./schema.ts";

export async function searchUsers(args: {
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

  const resp = await query<SearchUsers>(
    {
      endpoint: args.endpoint,
      query: q,
    },
  );

  return resp.data.search.nodes;
}

export async function getUsers(args: {
  assignees: string[];
}): Promise<GetUsers> {
  const users = args.assignees.map((user, i) => {
    return `user${i}: user(login: "${user}") {
      ...UserFragment
    }`;
  });
  const q = `
query {
  ${users.join("\n")}
}

fragment UserFragment on User {
  id
  login
}
  `;

  const resp = await query<GetUsers>({
    query: q,
  });
  return resp;
}
