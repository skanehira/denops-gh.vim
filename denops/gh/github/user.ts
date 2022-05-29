import { GetUsers } from "./schema.ts";
import { gql } from "../deps.ts";
import { request } from "./api.ts";
import {
  SearchUserBodyFragment,
  SearchUsersQuery,
  SearchUsersQueryVariables,
} from "./graphql/operations.ts";

const fragmentSearchUser = gql`
fragment searchUserBody on User {
  id
  login
  name
  bio
}
`;

const querySearchUsers = gql`
${fragmentSearchUser}

query searchUsers($user: String!) {
  search(type: USER, query: $user, first: 10) {
    nodes{
      ... on User{
        ... searchUserBody
      }
    }
  }
}
`;

export async function searchUsers(args: {
  word: string;
}): Promise<SearchUserBodyFragment[]> {
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
