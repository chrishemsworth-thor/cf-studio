import type {
  CfApiResponse,
  CfListResponse,
  D1Database as CfD1Database,
  D1QueryResult,
  R2Bucket,
  Worker,
  PagesProject,
  PagesDeployment,
} from "@/types/cloudflare";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

export class CloudflareApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "CloudflareApiError";
  }
}

export class CloudflareClient {
  private readonly accountId: string;
  private readonly token: string;

  constructor(accountId: string, token: string) {
    this.accountId = accountId;
    this.token = token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}, timeoutMs = 15_000): Promise<T> {
    const url = `${CF_API_BASE}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new CloudflareApiError(408, "Request timed out after 15s — check your Account ID and token");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const text = await res.text();
      throw new CloudflareApiError(res.status, text);
    }
    const json = await res.json() as { success: boolean; errors?: { code: number; message: string }[] } & T;
    if (!json.success) {
      const msg = json.errors?.[0]?.message ?? "Cloudflare API error";
      throw new CloudflareApiError(res.status, msg);
    }
    return json as T;
  }

  readonly d1 = {
    listDatabases: () =>
      this.fetch<CfListResponse<CfD1Database>>(`/accounts/${this.accountId}/d1/database`),
    getDatabase: (id: string) =>
      this.fetch<CfApiResponse<CfD1Database>>(`/accounts/${this.accountId}/d1/database/${id}`),
    createDatabase: (name: string) =>
      this.fetch<CfApiResponse<CfD1Database>>(`/accounts/${this.accountId}/d1/database`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    deleteDatabase: (id: string) =>
      this.fetch<CfApiResponse<unknown>>(`/accounts/${this.accountId}/d1/database/${id}`, {
        method: "DELETE",
      }),
    query: async (databaseId: string, sql: string, params: unknown[] = []): Promise<CfApiResponse<D1QueryResult[]>> => {
      type Row = Record<string, unknown>;
      type QueryItem = { results: Row[]; success: boolean; meta: D1QueryResult["meta"] };
      const res = await this.fetch<CfApiResponse<QueryItem[]>>(
        `/accounts/${this.accountId}/d1/database/${databaseId}/query`,
        { method: "POST", body: JSON.stringify({ sql, params }) }
      );
      return {
        ...res,
        result: res.result.map((r) => ({
          ...r,
          results: {
            columns: r.results.length > 0 ? Object.keys(r.results[0]) : [],
            rows: r.results.map((row) => Object.values(row)),
          },
        })),
      };
    },
  };

  readonly r2 = {
    listBuckets: () =>
      this.fetch<CfApiResponse<{ buckets: R2Bucket[] }>>(`/accounts/${this.accountId}/r2/buckets`),
    createBucket: (name: string, locationHint?: string) =>
      this.fetch<CfApiResponse<R2Bucket>>(`/accounts/${this.accountId}/r2/buckets`, {
        method: "POST",
        body: JSON.stringify({ name, locationHint }),
      }),
    deleteBucket: (bucketName: string) =>
      this.fetch<CfApiResponse<unknown>>(`/accounts/${this.accountId}/r2/buckets/${bucketName}`, {
        method: "DELETE",
      }),
  };

  readonly workers = {
    list: () =>
      this.fetch<CfListResponse<Worker>>(`/accounts/${this.accountId}/workers/scripts`),
    get: (scriptName: string) =>
      this.fetch<CfApiResponse<Worker>>(`/accounts/${this.accountId}/workers/scripts/${scriptName}`),
    delete: (scriptName: string) =>
      this.fetch<CfApiResponse<unknown>>(
        `/accounts/${this.accountId}/workers/scripts/${scriptName}`,
        { method: "DELETE" }
      ),
  };

  readonly pages = {
    listProjects: () =>
      this.fetch<CfApiResponse<PagesProject[]>>(`/accounts/${this.accountId}/pages/projects`),
    getProject: (name: string) =>
      this.fetch<CfApiResponse<PagesProject>>(`/accounts/${this.accountId}/pages/projects/${name}`),
    listDeployments: (name: string) =>
      this.fetch<CfApiResponse<PagesDeployment[]>>(
        `/accounts/${this.accountId}/pages/projects/${name}/deployments`
      ),
    rollback: (name: string, deploymentId: string) =>
      this.fetch<CfApiResponse<PagesDeployment>>(
        `/accounts/${this.accountId}/pages/projects/${name}/deployments/${deploymentId}/rollback`,
        { method: "POST" }
      ),
  };
}

export function createCloudflareClient(accountId: string, plainTextToken: string): CloudflareClient {
  return new CloudflareClient(accountId, plainTextToken);
}
