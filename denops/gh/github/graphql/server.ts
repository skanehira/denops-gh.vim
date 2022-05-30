import { buildSchema, graphql } from "https://cdn.skypack.dev/graphql@16.5.0";
import {
  CommentAuthorAssociation,
  MutationUpdateIssueArgs,
  QueryRepositoryArgs,
  QueryUserArgs,
  RepositoryIssueArgs,
  RepositoryLabelArgs,
  RepositoryLabelsArgs,
  RepositoryMentionableUsersArgs,
  SearchType,
} from "./types.ts";
import { serve } from "https://deno.land/std@0.139.0/http/server.ts";
import {
  issue as testIssue,
  issues,
  issueWithComments,
  labels,
  notfoundIssueComment,
  repository,
  users as userTest,
} from "./testdata/issues.ts";
import { mentionAndAssigneUsers } from "./testdata/users.ts";
import { issueTemplates } from "./testdata/templates.ts";
import { issueComment } from "./testdata/issues_comment.ts";

const schema = buildSchema(await Deno.readTextFile("./schema.docs.graphql"));

type SearchQuery = {
  repo?: string;
  type?: string;
  label?: string;
  mentions?: string;
  author?: string;
  assignee?: string;
  state?: string[];
  title?: string;
  word?: string; // not filter qualifiers
};

type Issues = typeof issues;

function parseSearchQuery(query: string): SearchQuery {
  const ret = {} as { [key: string]: any };
  for (const q of query.split(" ")) {
    if (q.includes(":")) {
      const [k, v] = q.split(":");
      if (k === "state") {
        if (ret[k]) {
          ret[k].push(v);
        } else {
          ret[k] = [v];
        }
      } else if (v === "title") {
        ret[v] = ret["word"];
      } else {
        ret[k] = v;
      }
    } else {
      ret["word"] = q;
    }
  }
  return ret;
}

function filterIssueWithQuery(issues: Issues, query: string): Issues {
  if (!query) {
    return issues;
  }

  const q = parseSearchQuery(query);

  if (q.type) {
    if (q.type !== "issue") {
      return [];
    }
  }

  if (q.repo) {
    issues = issues.filter((issue) => {
      return q.repo === `${issue.repository.owner}/${issue.repository.name}`;
    });
  }

  if (q.state) {
    issues = issues.filter((issue) => {
      return q.state!.some((state) => {
        return state.toLowerCase() === issue.state.toLowerCase();
      });
    });
  }

  if (q.title) {
    issues = issues.filter((issue) => {
      return issue.title === q.title;
    });
  }

  if (q.assignee) {
    issues = issues.filter((issue) => {
      return issue.assignees.nodes.some((user) => user.name === q.assignee);
    });
  }

  if (q.author) {
    issues = issues.filter((issue) => {
      return issue.author.login == q.author;
    });
  }

  if (q.label) {
    issues = issues.filter((issue) => {
      return issue.labels.nodes.some((label) => label.name === q.label);
    });
  }

  if (q.mentions) {
    issues = issues.filter((issue) => {
      return q.mentions === issue.author.login;
    });
  }

  return issues;
}

function getMentionAndAssigneUsers(args: RepositoryMentionableUsersArgs) {
  let users = mentionAndAssigneUsers;
  if (args.query) {
    const query = args.query;
    users = users.filter((user) =>
      user.login.toLowerCase().includes(query.toLowerCase())
    );
  }
  return {
    nodes: users,
  };
}

function getLabels(word: string) {
  return Object.values(labels).filter((label) => {
    return label.name === word;
  });
}

const resolvers = {
  search: (
    { first, type, query }: { type: SearchType; query: string; first?: number },
  ) => {
    if (type === SearchType.Issue) {
      const ret = filterIssueWithQuery(issues, query).slice(0, first);
      return {
        nodes: ret,
        pageInfo: {
          hasNextPage: false,
          endCursor: "Y3Vyc29yOjI=",
          startCursor: "Y3Vyc29yOjE=",
        },
      };
    }
    if (type === SearchType.User) {
      return {
        nodes: mentionAndAssigneUsers.filter((user) => {
          return user.login.includes(query);
        }),
      };
    }
  },
  user: (args: QueryUserArgs) => {
    const ret = mentionAndAssigneUsers.find((user) => {
      return user.login === args.login;
    });
    return ret;
  },
  repository: (args: QueryRepositoryArgs) => {
    if (args.name === "emptyIssuTemplate") {
      return {
        issueTemplates: [],
      };
    } else if (
      `${args.owner}/${args.name}` === `${repository.owner}/${repository.name}`
    ) {
      return {
        issue: (args: RepositoryIssueArgs) => {
          switch (args.number) {
            case testIssue.number:
              return testIssue;
            case issueWithComments.number:
              return issueWithComments;
            case notfoundIssueComment.number:
              return notfoundIssueComment;
          }
          return issues.find((issue) => issue.number === args.number);
        },
        mentionableUsers: getMentionAndAssigneUsers,
        assignableUsers: getMentionAndAssigneUsers,
        issueTemplates: issueTemplates,
        label: (args: RepositoryLabelArgs) => {
          const ret = getLabels(args.name);
          if (ret.length) {
            return ret[0];
          }
        },
        labels: (args: RepositoryLabelsArgs) => {
          if (args.query) {
            const labels = getLabels(args.query);
            return {
              nodes: labels,
            };
          }
        },
      };
    }
  },
  updateIssue: (args: MutationUpdateIssueArgs) => {
    const issue = testIssue;
    if (args.input.id === issue.id) {
      if (args.input.state) {
        issue.state = args.input.state;
      }
      if (args.input.title) {
        issue.title = args.input.title;
      }
      if (args.input.body) {
        issue.body = args.input.body;
      }
      if (args.input.assigneeIds) {
        issue.assignees = {
          nodes: Object.values(userTest).filter((u) =>
            args.input.assigneeIds?.some((id) => id === u.id)
          ),
        };
      }
      if (args.input.labelIds) {
        issue.labels = {
          nodes: Object.values(labels).filter((u) =>
            args.input.labelIds?.some((id) => id === u.id)
          ),
        };
      }
    }
    return {
      issue: issue,
    };
  },
};

const issueCommentRegexp = /repos\/\w+\/\w+\/issues\/comments\/\d+/;
const isIssueComment = (pathname: string): boolean => {
  return issueCommentRegexp.test(pathname);
};

const issueCreateCommentRegexp = /repos\/\w+\/\w+\/issues\/\d+\/comments/;
const isCreateIssueComment = (pathname: string): boolean => {
  return issueCreateCommentRegexp.test(pathname);
};

serve(async (req: Request) => {
  const url = new URL(req.url);
  const text = await req.text();
  if (url.pathname === "/graphql") {
    const body = JSON.parse(text);
    const resp = await graphql({
      schema,
      source: body.query,
      variableValues: body.variables,
      rootValue: resolvers,
    });
    return new Response(JSON.stringify(resp), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let resp = "{}";

  switch (req.method) {
    case "GET":
      if (isIssueComment(url.pathname)) {
        resp = JSON.stringify(issueComment);
      }
      break;
    case "PATCH":
      if (isIssueComment(url.pathname)) {
        issueComment.body = JSON.parse(text).body;
        resp = JSON.stringify(issueComment);
      }
      break;
    case "POST":
      if (isCreateIssueComment(url.pathname)) {
        const body = JSON.parse(text).body;
        const comment = {
          "databaseId": 707714974,
          "authorAssociation": CommentAuthorAssociation.Member,
          "id": "IC_kwDOEdLNec460eDe",
          "author": {
            __typename: "User",
            "login": "skanehira",
          },
          "body": body,
          "bodyHTML": body,
          "bodyText": body,
          "createdAt": "2020-10-13T12:44:56Z",
          "updatedAt": "2020-10-13T12:44:56Z",
          "viewerDidAuthor": false,
          "includesCreatedEdit": false,
          "createdViaEmail": false,
        };
        testIssue.comments.nodes.push(comment);
      }
      break;
  }

  return new Response(resp, {
    headers: { "Content-Type": "application/json" },
  });
}, { port: 8080 });
