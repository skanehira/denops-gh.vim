import { GetUsers } from "./schema.ts";
import { request } from "./api.ts";
import {
  SearchUsersQuery,
  SearchUsersQueryVariables,
  UserFragment,
} from "./graphql/operations.ts";

export const fragmentUser = `
fragment user on User {
  id
  login
  name
  bio
}
`;

const querySearchUsers = `
${fragmentUser}

query searchUsers($user: String!) {
  search(type: USER, query: $user, first: 10) {
    nodes{
      ... on User{
        ... user
      }
    }
  }
}
`;

export async function searchUsers(args: {
  word: string;
}): Promise<UserFragment[]> {
  const resp = await request<SearchUsersQuery, SearchUsersQueryVariables>(
    querySearchUsers,
    {
      user: args.word,
    },
  );

  if (!resp.search.nodes) {
    return [];
  }
  return resp.search.nodes;
}

export async function getUsers(args: {
  assignees: string[];
}): Promise<GetUsers> {
  const users = args.assignees.map((user, i) => {
    return `user${i}: user(login: "${user}") {
      ...UserFragment
    }`;
  });
  const query = `
query {
  ${users.join("\n")}
}

fragment UserFragment on User {
  id
  login
}
  `;

  const resp = await request<GetUsers>(query);
  return resp;
}
