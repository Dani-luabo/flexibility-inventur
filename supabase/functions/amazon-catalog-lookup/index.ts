// Supabase Edge Function: amazon-catalog-lookup
// Deploy: supabase functions deploy amazon-catalog-lookup

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── SigV4 helpers (same as amazon-sync) ────────────────────────────────────

async function sha256Hex(msg: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    "raw",
    key instanceof Uint8Array ? key.buffer : key,
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
}

async function derivedSigningKey(secret: string, date: string, region: string, service: string) {
  const kDate    = await hmacSha256(new TextEncoder().encode(`AWS4${secret}`), date);
  const kRegion  = await hmacSha256(kDate,    region);
  const kService = await hmacSha256(kRegion,  service);
  return              hmacSha256(kService, "aws4_request");
}

async function signRequest(
  method: string, url: string,
  base: Record<string, string>,
  accessKey: string, secretKey: string, region: string,
): Promise<Record<string, string>> {
  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);
  const service   = "execute-api";
  const parsed    = new URL(url);
  const headers: Record<string, string> = { ...base, host: parsed.hostname, "x-amz-date": amzDate };
  const sortedKeys = Object.keys(headers).map(k => k.toLowerCase()).sort();
  const canonHdrs  = sortedKeys.map(k => `${k}:${headers[Object.keys(headers).find(h => h.toLowerCase() === k)!].trim()}`).join("\n") + "\n";
  const signedHdrs = sortedKeys.join(";");
  const payloadHash = await sha256Hex("");
  const canonQS    = parsed.searchParams.toString();
  const canonReq   = [method, parsed.pathname, canonQS, canonHdrs, signedHdrs, payloadHash].join("\n");
  const credScope  = `${dateStamp}/${region}/${service}/aws4_request`;
  const s2s        = ["AWS4-HMAC-SHA256", amzDate, credScope, await sha256Hex(canonReq)].join("\n");
  const sigKey     = await derivedSigningKey(secretKey, dateStamp, region, service);
  const sigBytes   = await hmacSha256(sigKey, s2s);
  const sig        = [...new Uint8Array(sigBytes)].map(b => b.toString(16).padStart(2, "0")).join("");
  return { ...headers, Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credScope}, SignedHeaders=${signedHdrs}, Signature=${sig}` };
}

function spApiHost(region: string): string {
  if (/^us-east|^ca-|^sa-/.test(region)) return "sellingpartnerapi-na.amazon.com";
  if (/^ap-|^us-west-2/.test(region))    return "sellingpartnerapi-fe.amazon.com";
  return "sellingpartnerapi-eu.amazon.com";
}

// ─── Identifier type detection ───────────────────────────────────────────────

function detectIdentifierType(id: string): "ASIN" | "EAN" | "ISBN" {
  if (/^B[A-Z0-9]{9}$/i.test(id)) return "ASIN";
  if (/^\d{9}[0-9Xx]$/.test(id))  return "ISBN";
  return "EAN"; // covers EAN-8 / EAN-13 / UPC-A
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const { identifier } = await req.json() as { identifier?: string };
    if (!identifier?.trim()) return json({ error: "identifier is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load credentials from settings
    const { data: rows } = await supabase.from("settings").select("key, value")
      .in("key", ["amazon_client_id", "amazon_client_secret", "amazon_refresh_token",
                  "amazon_marketplace_id", "amazon_aws_access_key", "amazon_aws_secret_key", "amazon_region"]);

    const c: Record<string, string> = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]));

    if (!c.amazon_client_id || !c.amazon_client_secret || !c.amazon_refresh_token) {
      return json({ error: "Amazon credentials not configured" }, 400);
    }

    // LWA access token
    const tokenRes  = await fetch("https://api.amazon.com/auth/o2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: c.amazon_refresh_token,
        client_id:    c.amazon_client_id,
        client_secret: c.amazon_client_secret,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) return json({ error: "LWA token exchange failed", details: tokenJson }, 400);

    const region        = c.amazon_region        ?? "eu-west-1";
    const marketplaceId = c.amazon_marketplace_id ?? "A1PA6795UKMFR9";
    const host          = spApiHost(region);
    const identifierType = detectIdentifierType(identifier.trim());

    // Catalog Items API v2022-04-01
    const params = new URLSearchParams({
      identifiers:     identifier.trim(),
      identifierTypes: identifierType,
      marketplaceIds:  marketplaceId,
      includedData:    "summaries",
    });
    const apiUrl = `https://${host}/catalog/2022-04-01/items?${params}`;

    let reqHeaders: Record<string, string> = { "x-amz-access-token": tokenJson.access_token };
    if (c.amazon_aws_access_key && c.amazon_aws_secret_key) {
      reqHeaders = await signRequest("GET", apiUrl, reqHeaders, c.amazon_aws_access_key, c.amazon_aws_secret_key, region);
    }

    const catalogRes  = await fetch(apiUrl, { headers: reqHeaders });
    const catalogJson = await catalogRes.json();

    // Normalise response (v2022-04-01 vs older wrapper)
    const items: unknown[] = catalogJson.items ?? catalogJson.payload?.items ?? [];

    if (!items.length) {
      return json({ error: "Product not found", identifier: identifier.trim() }, 404);
    }

    type Item = { asin: string; summaries?: Array<{ marketplaceId: string; itemName?: string; browseClassification?: { displayName?: string } }> };
    const item = items[0] as Item;
    const summary = item.summaries?.find(s => s.marketplaceId === marketplaceId) ?? item.summaries?.[0] ?? {};

    return json({
      asin:     item.asin,
      name:     summary.itemName ?? "",
      category: summary.browseClassification?.displayName ?? "",
    });

  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
