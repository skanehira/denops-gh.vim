const { ApolloServer, gql } = require("apollo-server");
const fs = require("fs");

const schema = fs.readFileSync("./schema.docs.graphql", "utf8");

const typeDefs = gql`${schema}`;

const issues = [
  {
    __typename: "Issue",
    id: "MDU6SXNzdWU3MDk3MzE0NTA=",
    title: "Add feature of quote reply",
    author: {
      __typename: "User",
      login: "skanehira",
    },
    assignees: {
      nodes: [],
    },
    body: "# test body\nHello World",
    labels: {
      nodes: [
        {
          name: "enhancement",
          color: "a2eeef",
        },
        {
          name: "help wanted",
          color: "008672",
        },
      ],
    },
    closed: false,
    number: 121,
    url: "https://github.com/skanehira/gh.vim/issues/121",
    state: "OPEN",
    repository: {
      name: "gh.vim",
    },
    comments: {
      nodes: []
    }
  },
  {
    __typename: "Issue",
    id: "MDU6SXNzdWU3MDk3MzE0NTB=",
    title: "Allow autoselect owner and project of current directory(git repo)",
    author: {
      __typename: "User",
      login: "korney4eg",
    },
    assignees: {
      nodes: [
        {
          __typename: "User",
          login: "skanehira",
        },
      ],
    },
    body: "# test2\nbody uhouho",
    labels: {
      nodes: [
        {
          name: "enhancement",
          color: "a2eeef",
        },
      ],
    },
    closed: true,
    number: 124,
    url: "https://github.com/skanehira/gh.vim/issues/124",
    state: "CLOSED",
    repository: {
      name: "gh.vim",
    },
    comments: {
      nodes: []
    }
  },
];

const associatedPullRequests = [
  {
    __typename: "PullRequest",
    "title": "Fix usage",
    "url": "https://github.com/skanehira/getpr/pull/2",
    "state": "MERGED",
    "number": 2,
  },
];

const pageInfo = {
  hasNextPage: false,
  startCursor: "Y3Vyc29yOjE=",
  endCursor: "Y3Vyc29yOjEw",
};

const resolvers = {
  Query: {
    repository: (_parent, args, _context, _info) => {
      console.log(args);
      return {
        object: (args) => {
          const nodes = [];
          if (args.expression === "110b584") {
            nodes.push(...associatedPullRequests);
          }
          const resp = {
            __typename: "Commit",
            associatedPullRequests: {
              nodes: nodes,
            },
          };

          return resp;
        },
      };
    },
    search: (_parent, args, _context, _info) => {
      const values = args.query.split(" ");
      console.log(values);
      let nodes = [];

      const isIssue = values.some((v) => {
        return v === "type:issue";
      });
      if (isIssue) {
        nodes = issues;
      }

      const isOpen = values.some((v) => {
        return v === "state:OPEN";
      });

      nodes = nodes.filter((v) => {
        return !v.closed === isOpen;
      });

      return {
        nodes: nodes,
        pageInfo: pageInfo,
      };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
