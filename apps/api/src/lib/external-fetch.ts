import https from "node:https";

const TLS_RETRY_CODES = new Set([
  "CERT_HAS_EXPIRED",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
]);

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

function tlsErrorCode(error: unknown): string | undefined {
  const cause = (error as { cause?: { code?: string } }).cause;
  return cause?.code;
}

function useInsecureTls(): boolean {
  return process.env.EXTERNAL_LOGIN_INSECURE === "true";
}

type ExternalFetchInit = {
  method?: string;
  headers?: Record<string, string>;
};

function httpsRequest(url: string, init: ExternalFetchInit, insecure: boolean): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        method: init.method ?? "GET",
        headers: init.headers,
        agent: insecure ? insecureAgent : undefined,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          const headers = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (value !== undefined)
              headers.set(key, Array.isArray(value) ? value.join(", ") : value);
          }
          resolve(new Response(body, { status: res.statusCode ?? 500, headers }));
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

/** 请求外部登录服务；证书无效时可自动降级（内网工具场景）。 */
export async function externalFetch(url: string, init?: ExternalFetchInit): Promise<Response> {
  if (useInsecureTls()) {
    return httpsRequest(url, init ?? {}, true);
  }

  try {
    return await fetch(url, init);
  } catch (error) {
    const code = tlsErrorCode(error);
    if (code && TLS_RETRY_CODES.has(code)) {
      console.warn(`external fetch TLS error (${code}), retrying with insecure TLS`);
      return httpsRequest(url, init ?? {}, true);
    }
    throw error;
  }
}
