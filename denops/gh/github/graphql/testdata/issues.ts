import { IssueState } from "../types.ts";

export const labels = {
  "MDU6TGFiZWwyMzgwMTEzMTk4": {
    __typename: "Label",
    "id": "MDU6TGFiZWwyMzgwMTEzMTk4",
    "name": "bug",
    "color": "d73a4a",
    "description": "Something isn't working",
  },
  "MDU6TGFiZWwyMzgwMTEzMTk5": {
    __typename: "Label",
    "id": "MDU6TGFiZWwyMzgwMTEzMTk5",
    "name": "documentation",
    "color": "0075ca",
    "description": "Improvements or additions to documentation",
  },
};

export const users = {
  "MDQ6VXNlcjc4ODg1OTE=": {
    __typename: "User",
    id: "MDQ6VXNlcjc4ODg1OTE=",
    name: "skanehira",
    bio: "Like Vim, Go.\r\nMany CLI/TUI Tools, Vim plugins author.",
    login: "skanehira",
  },
  "MDQ6VXNlcjU3NTc5MTIz": {
    __typename: "User",
    "id": "MDQ6VXNlcjU3NTc5MTIz",
    "name": "gorilla",
    "bio": "This is test user",
    "login": "gorilla",
  },
};

export const comments = [
  {
    __typename: "Comment",
    "databaseId": 707713426,
    "author": {
      __typename: "User",
      "login": "skanehira",
    },
    "body": "テスト4\r\nテスト5",
  },
  {
    __typename: "Comment",
    "databaseId": 707714271,
    "author": {
      __typename: "User",
      "login": "skanehira",
    },
    "body": "## これはテスト5\n",
  },
  {
    __typename: "Comment",
    "databaseId": 707714566,
    "author": {
      __typename: "User",
      "login": "skanehira",
    },
    "body": "test6",
  },
  {
    __typename: "Comment",
    "databaseId": 707729573,
    "author": {
      __typename: "User",
      "login": "skanehira",
    },
    "body": "test7",
  },
];

export const issueWithComments = {
  __typename: "Issue",
  "number": 2,
  "comments": (input: { first: number }) => {
    return {
      nodes: comments.slice(0, input.first),
      "pageInfo": {
        "startCursor": "Y3Vyc29yOnYyOpHOKi7Zkg==",
        "endCursor": "Y3Vyc29yOnYyOpHOKi8YpQ==",
      },
    };
  },
};

export const issue = {
  __typename: "Issue",
  "id": "MDU6SXNzdWU3MDk3MzE0NTA=",
  "title": "test1",
  "author": users["MDQ6VXNlcjc4ODg1OTE="],
  "assignees": {
    "nodes": [
      users["MDQ6VXNlcjc4ODg1OTE="],
      users["MDQ6VXNlcjU3NTc5MTIz"],
    ],
  },
  "body": "# this is test\r\ntest issue",
  "labels": {
    "nodes": [
      labels["MDU6TGFiZWwyMzgwMTEzMTk5"],
    ],
  },
  "closed": false,
  "number": 1,
  "repository": {
    __typename: "Repository",
    "owner": "skanehira",
    "name": "test",
  },
  "url": "https://github.com/skanehira/test/issues/1",
  "state": IssueState.Closed,
  "comments": {
    "nodes": [],
  },
};

export const issues = [
  {
    __typename: "Issue",
    id: "MDU6SXNzdWU4MTI4NzY0MDg=",
    title: "test2",
    author: {
      __typename: "User",
      resourcePath: "",
      avatarUrl: "",
      url: "https://github.com/skanehira",
      login: "skanehira",
    },
    assignees: {
      nodes: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
      },
      totalCount: 0,
    },
    body:
      "## 💪 タスク\r\ntest3\r\n\r\n### 🔖 関連issue\r\ntest3\r\n\r\n### 📄 資料\r\n(参考資料、サイトなどあれば書く )\r\n\r\n### ✅ 作業\r\n(どんな作業があるのか、大まかに書く)\r\n\r\n### 🚀 ゴール\r\n(タスクのゴールを書く)\r\n",
    labels: {
      nodes: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      totalCount: 0,
    },
    closed: false,
    number: 27,
    repository: {
      __typename: "Repository",
      "owner": "skanehira",
      name: "test",
    },
    url: "https://github.com/skanehira/test/issues/27",
    state: IssueState.Open,
    comments: {
      nodes: [],
    },
  },
  {
    __typename: "Issue",
    id: "MDU6SXNzdWU4MTI4NzYzMjI=",
    title: "テスト",
    author: {
      __typename: "User",
      login: "skanehira",
    },
    assignees: {
      nodes: [
        users["MDQ6VXNlcjc4ODg1OTE="],
      ],
    },
    body:
      "## 🐛 Summary\r\nバグ\r\n\r\n## 👀 Steps\r\n(バグの再現手順)\r\n\r\n1. Do action\r\n2. Do another action\r\n3. Wrong Behavior !!\r\n\r\n## 🆗 Expected\r\n(本来あるべき姿)\r\n\r\n## 🚑 Actual\r\n(Issueを作成した時点の動作)\r\n\r\n## 📎 Images or log(optional)\r\n(バグ発生時の画像もしくはログ)\r\n",
    labels: {
      nodes: [
        {
          name: "bug",
          color: "d73a4a",
          description: "Something isn't working",
        },
        {
          name: "duplicate",
          color: "cfd3d7",
          description: "This issue or pull request already exists",
        },
      ],
    },
    closed: true,
    number: 26,
    repository: {
      __typename: "Repository",
      "owner": "skanehira",
      name: "test",
    },
    url: "https://github.com/skanehira/test/issues/26",
    state: IssueState.Closed,
    comments: {
      nodes: [
        {
          __typename: "Comment",
          "databaseId": 707714566,
          "id": "IC_kwDOEdLNec460eDd",
          "author": {
            __typename: "User",
            "login": "skanehira",
          },
          "body": "test",
        },
      ],
      pageInfo: {
        "startCursor": "Y3Vyc29yOnYyOpHOKi7Zkg==",
        "endCursor": "Y3Vyc29yOnYyOpHOKi8YpQ==",
      },
    },
  },
];

export const repository = {
  __typename: "Repository",
  owner: "skanehira",
  name: "test",
  issue: issue,
};
