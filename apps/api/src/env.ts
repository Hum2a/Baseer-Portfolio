export type Env = {
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
  MEDIA: R2Bucket;
  ASSETS?: Fetcher;
  APP_URL: string;
  OWNER_ID: string;
  BETTER_AUTH_SECRET: string;
  ADMIN_EMAIL?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
};

export type AppVariables = {
  userId: string;
  userEmail: string;
};
