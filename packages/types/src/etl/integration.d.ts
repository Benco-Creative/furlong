// integration types
export enum E_INTEGRATION_KEYS {
  GITHUB = "GITHUB",
  GITLAB = "GITLAB",
  SLACK = "SLACK",
}
export type TIntegrationKeys = keyof typeof E_INTEGRATION_KEYS;

export enum E_ENTITY_CONNECTION_KEYS {
  SLACK_USER = "SLACK-USER",
  GITHUB_USER = "GITHUB-USER",
  GITLAB_USER = "GITLAB-USER",
}

export type TEntityConnectionKeys = keyof typeof E_ENTITY_CONNECTION_KEYS;
