import { query } from "./api.ts";
import { GetUsers } from "./schema.ts";
import { gql } from "../deps.ts";
import { endpoint, request } from "./api.ts";
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

query searchUsers($query: String!) {
  search(type: USER, query: $query, first: 10) {
    nodes{
      ... on User{
        ... searchUserBody
      }
    }
  }
}
`;

export async function searchUsers(args: {
  endpoint?: string;
  word: string;
}): Promise<SearchUserBodyFragment[]> {
  const resp = await request<SearchUsersQuery, SearchUsersQueryVariables>(
    args.endpoint ?? endpoint,
    querySearchUsers,
    {
      query: args.word,
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
