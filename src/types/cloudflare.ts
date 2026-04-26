export interface CfApiResponse<T> {
  result: T;
  success: boolean;
  errors: { code: number; message: string }[];
  messages: string[];
}

export interface CfListResponse<T> {
  result: T[];
  success: boolean;
  errors: { code: number; message: string }[];
  result_info?: { count: number; page: number; per_page: number; total_count: number };
}

export interface D1Database {
  uuid: string;
  name: string;
  created_at: string;
  version: string;
  num_tables?: number;
}

export interface D1RawResults {
  columns: string[];
  rows: unknown[][];
}

export interface D1QueryResult {
  results: D1RawResults;
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
    last_row_id?: number;
    changes?: number;
  };
}

export interface D1ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export interface D1IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

export interface D1ForeignKeyInfo {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

export interface D1TableSchema {
  name: string;
  columns: D1ColumnInfo[];
  indexes: D1IndexInfo[];
  foreignKeys: D1ForeignKeyInfo[];
}

export interface R2Bucket {
  name: string;
  creation_date: string;
  location?: string;
}

export interface WorkerRoute {
  id: string;
  pattern: string;
  script: string;
}

export interface WorkerDeployment {
  id: string;
  created_on: string;
  source?: string;
  author_email?: string;
  annotations?: { message?: string; trigger_operation?: string };
}
  
export interface R2Object {
  key: string;
  size: number;
  etag: string;
  last_modified: string;
  content_type?: string;
  storage_class?: string;
}

export interface R2CorsRule {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders?: string[];
  exposeHeaders?: string[];
  maxAgeSeconds?: number;
}

export interface Worker {
  id: string;
  etag: string;
  script?: string;
  created_on: string;
  modified_on: string;
  deployment_id?: string;
  tail_consumers?: unknown[];
  usage_model?: string;
  handlers?: string[];
  routes?: WorkerRoute[];
}

export interface PagesProject {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
  created_on: string;
  latest_deployment?: PagesDeployment;
}

export interface PagesDeployment {
  id: string;
  url: string;
  created_on: string;
  latest_stage: { name: string; status: string };
  deployment_trigger: { type: string };
  short_id: string;
}
