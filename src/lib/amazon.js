import { supabase } from "../supabase";

// Alle Credential-Keys die in der settings-Tabelle gespeichert werden
const CRED_KEYS = [
  "amazon_client_id",
  "amazon_client_secret",
  "amazon_refresh_token",
  "amazon_marketplace_id",
  "amazon_aws_access_key",
  "amazon_aws_secret_key",
  "amazon_region",
];

// Credentials aus Supabase laden — gibt null zurück wenn nicht konfiguriert
export async function loadAmazonCredentials() {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [...CRED_KEYS, "amazon_last_sync"]);
  if (error || !data?.length) return null;
  const c = Object.fromEntries(data.map((r) => [r.key, r.value]));
  // Nur als konfiguriert gelten wenn die drei Pflichtfelder vorhanden sind
  if (!c.amazon_client_id || !c.amazon_client_secret || !c.amazon_refresh_token) return null;
  return c;
}

// Credentials in Supabase speichern (upsert by key)
export async function saveAmazonCredentials(creds) {
  const rows = Object.entries(creds)
    .filter(([, v]) => v !== "" && v != null)
    .map(([key, value]) => ({ key, value }));
  const { error } = await supabase
    .from("settings")
    .upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

// Barcode / EAN / ASIN per Amazon Catalog Items API auflösen
export async function lookupProduct(identifier) {
  const { data, error } = await supabase.functions.invoke("amazon-catalog-lookup", {
    body: { identifier },
  });
  // Supabase surfaces HTTP error bodies in `data` even when error is set
  const errMsg = data?.error ?? error?.message;
  if (errMsg) throw new Error(errMsg);
  return data; // { asin, name, category }
}

// Supabase Edge Function aufrufen — führt SP-API Sync durch
export async function triggerSync() {
  const { data, error } = await supabase.functions.invoke("amazon-sync");
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data; // { success, updated, total, syncedAt }
}
