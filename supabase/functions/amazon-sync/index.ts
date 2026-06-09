// Supabase Edge Function: amazon-sync
// Deploy: supabase functions deploy amazon-sync
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (set automatically by Supabase)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── AWS SigV4 helpers ────────────────────────────────────────────────────────

async function sha256Hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    "raw",
    key instanceof Uint8Array ? key.buffer : key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
}

async function derivedSigningKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate    = await hmacSha256(new TextEncoder().encode(`AWS4${secret}`), date);
  const kRegion  = await hmacSha256(kDate,    region);
  const kService = await hmacSha256(kRegion,  service);
  return              hmacSha256(kService, "aws4_request");
}

async function signSpApiRequest(
  method: string,
  url: string,
  baseHeaders: Record<string, string>,
  accessKey: string,
  secretKey: string,
  region: string,
): Promise<Record<string, string>> {
  const now       = new Date();
  // Format: 20260601T120000Z
  const amzDate   = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);
  const service   = "execute-api";
  const parsed    = new URL(url);

  const headers: Record<string, string> = {
    ...baseHeaders,
    host:         parsed.hostname,
    "x-amz-date": amzDate,
  };

  const sortedKeys   = Object.keys(headers).map((k) => k.toLowerCase()).sort();
  const canonicalHdrs = sortedKeys
    .map((k) => `${k}:${headers[Object.keys(headers).find((h) => h.toLowerCase() === k)!].trim()}`)
    .join("\n") + "\n";
  const signedHdrs   = sortedKeys.join(";");
  const payloadHash  = await sha256Hex("");
  const canonicalQS  = parsed.searchParams.toString();
  const canonicalReq = [method, parsed.pathname, canonicalQS, canonicalHdrs, signedHdrs, payloadHash].join("\n");
  const credScope    = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credScope, await sha256Hex(canonicalReq)].join("\n");
  const sigKey       = await derivedSigningKey(secretKey, dateStamp, region, service);
  const sigBytes     = await hmacSha256(sigKey, stringToSign);
  const sig          = [...new Uint8Array(sigBytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return {
    ...headers,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credScope}, SignedHeaders=${signedHdrs}, Signature=${sig}`,
  };
}

// ─── SP-API endpoint by region ────────────────────────────────────────────────
function spApiHost(region: string): string {
  if (region.startsWith("us-east") || region.startsWith("ca-") || region.startsWith("sa-")) {
    return "sellingpartnerapi-na.amazon.com";
  }
  if (region.startsWith("ap-") || region === "us-west-2") {
    return "sellingpartnerapi-fe.amazon.com";
  }
  return "sellingpartnerapi-eu.amazon.com";
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Credentials aus settings-Tabelle laden
    const { data: rows } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["amazon_client_id", "amazon_client_secret", "amazon_refresh_token",
                  "amazon_marketplace_id", "amazon_aws_access_key", "amazon_aws_secret_key", "amazon_region"]);

    const c: Record<string, string> = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));

    if (!c.amazon_client_id || !c.amazon_client_secret || !c.amazon_refresh_token) {
      return json({ error: "Amazon credentials not configured" }, 400);
    }

    // 2. LWA Access Token holen (Login with Amazon)
    const tokenRes  = await fetch("https://api.amazon.com/auth/o2/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        grant_type:    "refresh_token",
        refresh_token: c.amazon_refresh_token,
        client_id:     c.amazon_client_id,
        client_secret: c.amazon_client_secret,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
      return json({ error: "LWA token exchange failed", details: tokenJson }, 400);
    }

    // 3. SP-API FBA Inventory abrufen
    const region        = c.amazon_region        ?? "eu-west-1";
    const marketplaceId = c.amazon_marketplace_id ?? "A1PA6795UKMFR9";
    const host          = spApiHost(region);
    const apiUrl        = `https://${host}/fba/inventory/v1/summaries`
      + `?details=true&granularityType=Marketplace&granularityId=${marketplaceId}&marketplaceIds=${marketplaceId}`;

    let reqHeaders: Record<string, string> = { "x-amz-access-token": tokenJson.access_token };

    if (c.amazon_aws_access_key && c.amazon_aws_secret_key) {
      reqHeaders = await signSpApiRequest("GET", apiUrl, reqHeaders, c.amazon_aws_access_key, c.amazon_aws_secret_key, region);
    }

    const inventoryRes  = await fetch(apiUrl, { headers: reqHeaders });
    const inventoryJson = await inventoryRes.json();

    if (!inventoryJson.payload?.inventorySummaries) {
      return json({ error: "Unexpected SP-API response", details: inventoryJson }, 500);
    }

    // 4. Produkte in der DB aktualisieren (matched by SKU = products.id)
    type Summary = { sellerSku: string; fulfillableQuantity: number };
    const summaries: Summary[] = inventoryJson.payload.inventorySummaries;
    let updated = 0;

    for (const item of summaries) {
      const { error: dbErr } = await supabase
        .from("products")
        .update({ amazon_fba: item.fulfillableQuantity ?? 0 })
        .eq("id", item.sellerSku);
      if (!dbErr) updated++;
    }

    // 5. Letzten Sync-Zeitstempel merken
    const syncedAt = new Date().toISOString();
    await supabase.from("settings")
      .upsert({ key: "amazon_last_sync", value: syncedAt }, { onConflict: "key" });

    return json({ success: true, updated, total: summaries.length, syncedAt });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
