import { useState, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { supabase } from "./supabase";

// ─── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  de: {
    "splash.subtitle":          "Inventory Management",
    "header.subtitle":          "Inventur 2026",
    "header.nav.stock":         "Bestände",
    "header.nav.deliveries":    "Lieferungen",
    "header.addItem":           "+ Artikel",
    "status.ok":                "OK",
    "status.low":               "Niedrig",
    "status.critical":          "Kritisch",
    "status.out":               "Leer",
    "filter.all":               "Alle Artikel",
    "filter.incoming":          "Lieferungen",
    "filter.empty":             "Keine Artikel in dieser Kategorie.",
    "card.warehouse":           "Lager",
    "card.fba":                 "FBA",
    "card.total":               "Gesamt",
    "card.minStock":            "Mindestbestand",
    "card.pcs":                 "Stk.",
    "card.arrival.prefix":      "+{qty} am",
    "detail.save":              "Speichern",
    "detail.saving":            "Speichert...",
    "detail.edit":              "Bearbeiten",
    "detail.cancel":            "Abbrechen",
    "detail.saveError":         "Fehler beim Speichern:",
    "detail.kpi.warehouse":     "Lager",
    "detail.kpi.fba":           "Amazon FBA",
    "detail.kpi.total":         "Gesamt",
    "detail.progress.label":    "Lagerstand vs. Mindestbestand",
    "detail.progress.of":       "von",
    "detail.section.master":    "Stammdaten",
    "detail.section.stock":     "Bestände",
    "detail.section.logistics": "Logistik",
    "detail.field.name":        "Artikelname",
    "detail.field.category":    "Kategorie",
    "detail.field.sku":         "SKU",
    "detail.field.asin":        "ASIN",
    "detail.field.warehouse":   "Lager",
    "detail.field.fba":         "Amazon FBA",
    "detail.field.reserved":    "Reserviert",
    "detail.field.minStock":    "Mindestbestand",
    "detail.field.orderUnit":   "Bestelleinheit",
    "detail.field.leadTime":    "Lieferzeit (Tage)",
    "detail.field.arrivalDate": "Ankunft Datum",
    "detail.field.arrivalQty":  "Ankunft Menge",
    "detail.nextDelivery":      "📦 Nächste Lieferung",
    "detail.delivery.date":     "Datum",
    "detail.delivery.qty":      "Menge",
    "detail.delivery.pcs":      "Stk.",
    "detail.chart.title":       "Einkäufe vs. Verkäufe — 12 Monate",
    "detail.chart.purchase":    "Einkauf",
    "detail.chart.sales":       "Verkauf",
    "detail.chart.trend":       "Trend",
    "deliveries.empty":         "Keine Lieferungen geplant.",
    "deliveries.col.qty":       "Menge",
    "deliveries.col.current":   "Aktuell",
    "deliveries.today":         "Heute",
    "deliveries.tomorrow":      "Morgen",
    "deliveries.inDays":        "in {n}d",
    "app.loading":              "Artikel werden geladen...",
    "app.error":                "Fehler beim Laden der Daten.",
    "app.retry":                "Erneut laden",
    "modal.title":              "Neuer Artikel",
    "modal.create":             "Erstellen",
    "modal.creating":           "Wird erstellt...",
    "modal.cancel":             "Abbrechen",
    "modal.field.sku":          "SKU *",
    "modal.field.name":         "Artikelname *",
    "modal.field.category":     "Kategorie",
    "modal.field.asin":         "ASIN",
    "modal.field.warehouse":    "Lagerbestand",
    "modal.field.minStock":     "Mindestbestand",
    "modal.err.skuRequired":    "SKU ist erforderlich.",
    "modal.err.nameRequired":   "Artikelname ist erforderlich.",
    "modal.err.skuExists":      "Diese SKU existiert bereits.",
  },
  en: {
    "splash.subtitle":          "Inventory Management",
    "header.subtitle":          "Inventory 2026",
    "header.nav.stock":         "Stock",
    "header.nav.deliveries":    "Deliveries",
    "header.addItem":           "+ Add Item",
    "status.ok":                "OK",
    "status.low":               "Low",
    "status.critical":          "Critical",
    "status.out":               "Empty",
    "filter.all":               "All Items",
    "filter.incoming":          "Deliveries",
    "filter.empty":             "No items in this category.",
    "card.warehouse":           "Warehouse",
    "card.fba":                 "FBA",
    "card.total":               "Total",
    "card.minStock":            "Min. stock",
    "card.pcs":                 "pcs.",
    "card.arrival.prefix":      "+{qty} on",
    "detail.save":              "Save",
    "detail.saving":            "Saving...",
    "detail.edit":              "Edit",
    "detail.cancel":            "Cancel",
    "detail.saveError":         "Save failed:",
    "detail.kpi.warehouse":     "Warehouse",
    "detail.kpi.fba":           "Amazon FBA",
    "detail.kpi.total":         "Total",
    "detail.progress.label":    "Stock vs. Min. stock",
    "detail.progress.of":       "of",
    "detail.section.master":    "Master Data",
    "detail.section.stock":     "Stock Levels",
    "detail.section.logistics": "Logistics",
    "detail.field.name":        "Item name",
    "detail.field.category":    "Category",
    "detail.field.sku":         "SKU",
    "detail.field.asin":        "ASIN",
    "detail.field.warehouse":   "Warehouse",
    "detail.field.fba":         "Amazon FBA",
    "detail.field.reserved":    "Reserved",
    "detail.field.minStock":    "Min. stock",
    "detail.field.orderUnit":   "Order unit",
    "detail.field.leadTime":    "Lead time (days)",
    "detail.field.arrivalDate": "Arrival date",
    "detail.field.arrivalQty":  "Arrival qty.",
    "detail.nextDelivery":      "📦 Next Delivery",
    "detail.delivery.date":     "Date",
    "detail.delivery.qty":      "Quantity",
    "detail.delivery.pcs":      "pcs.",
    "detail.chart.title":       "Purchases vs. Sales — 12 months",
    "detail.chart.purchase":    "Purchase",
    "detail.chart.sales":       "Sales",
    "detail.chart.trend":       "Trend",
    "deliveries.empty":         "No deliveries scheduled.",
    "deliveries.col.qty":       "Quantity",
    "deliveries.col.current":   "Current",
    "deliveries.today":         "Today",
    "deliveries.tomorrow":      "Tomorrow",
    "deliveries.inDays":        "in {n}d",
    "app.loading":              "Loading items...",
    "app.error":                "Failed to load data.",
    "app.retry":                "Retry",
    "modal.title":              "New Item",
    "modal.create":             "Create",
    "modal.creating":           "Creating...",
    "modal.cancel":             "Cancel",
    "modal.field.sku":          "SKU *",
    "modal.field.name":         "Item name *",
    "modal.field.category":     "Category",
    "modal.field.asin":         "ASIN",
    "modal.field.warehouse":    "Warehouse stock",
    "modal.field.minStock":     "Min. stock",
    "modal.err.skuRequired":    "SKU is required.",
    "modal.err.nameRequired":   "Item name is required.",
    "modal.err.skuExists":      "This SKU already exists.",
  },
};

const CHART_MONTHS = {
  de: ["Jul", "Aug", "Sep", "Okt", "Nov", "Dez", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun"],
  en: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
};

const DATE_LOCALE = { de: "de-DE", en: "en-GB" };

// ─── i18n Context ─────────────────────────────────────────────────────────────
const LangContext = createContext({ lang: "de", t: (k) => k, setLang: () => {} });

function useT() { return useContext(LangContext); }

function makeTFn(lang) {
  return (key, vars = {}) => {
    let str = translations[lang]?.[key] ?? translations.de[key] ?? key;
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
    return str;
  };
}

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ─── Supabase: Produkt-Hook ───────────────────────────────────────────────────
function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (error) setError(error.message);
    else setProducts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Bestehenden Artikel aktualisieren (upsert by primary key `id`)
  const save = useCallback(async (product) => {
    const { data, error } = await supabase
      .from("products")
      .upsert(product)
      .select()
      .single();
    if (error) throw new Error(error.message);
    setProducts(ps => ps.map(p => p.id === data.id ? data : p));
    return data;
  }, []);

  // Neuen Artikel anlegen
  const add = useCallback(async (product) => {
    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select()
      .single();
    if (error) throw new Error(error.message);
    setProducts(ps => [...ps, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  }, []);

  return { products, loading, error, reload: load, save, add };
}

// ─── Chart-Platzhalterdaten ───────────────────────────────────────────────────
const generateChartData = () =>
  Array.from({ length: 12 }, (_, i) => ({
    monthIdx: i,
    einkauf: Math.floor(Math.random() * 120) + 20,
    verkauf: Math.floor(Math.random() * 100) + 10,
  }));

// ─── Status-Logik ─────────────────────────────────────────────────────────────
function getStatus(p) {
  const total = p.lager + p.amazon_fba;
  if (total === 0) return "out";
  if (total < p.min_bestand * 0.5) return "critical";
  if (total < p.min_bestand) return "low";
  return "ok";
}

const STATUS_CONFIG = {
  ok:       { labelKey: "status.ok",       color: "#4ade80", bg: "rgba(74,222,128,0.15)", icon: "✓" },
  low:      { labelKey: "status.low",      color: "#facc15", bg: "rgba(250,204,21,0.15)",  icon: "⚠" },
  critical: { labelKey: "status.critical", color: "#f87171", bg: "rgba(248,113,113,0.15)", icon: "✕" },
  out:      { labelKey: "status.out",      color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: "●" },
};

// ─── Design-Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:          "radial-gradient(ellipse at top left, #0d2b22 0%, #061210 70%)",
  glass:       "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.10)",
  glassHover:  "rgba(255,255,255,0.10)",
  accent:      "#4ade80",
  accentDim:   "rgba(74,222,128,0.15)",
  text:        "#e2e8f0",
  textDim:     "rgba(226,232,240,0.55)",
  radius:      14,
  blur:        "blur(16px)",
};

const glass = (extra = {}) => ({
  background: T.glass,
  backdropFilter: T.blur,
  WebkitBackdropFilter: T.blur,
  border: `1px solid ${T.glassBorder}`,
  borderRadius: T.radius,
  ...extra,
});

const inputStyle = {
  width: "100%", padding: "8px 12px",
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, color: T.text, fontSize: 14, outline: "none",
  fontFamily: "Inter, sans-serif",
};

// ─── Splash Screen ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("in");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => { if (p >= 100) { clearInterval(interval); return 100; } return p + 2; });
    }, 45);
    const hold = setTimeout(() => setPhase("out"), 2500);
    const done = setTimeout(() => onDone(), 3100);
    return () => { clearInterval(interval); clearTimeout(hold); clearTimeout(done); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: T.bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      transition: "opacity 0.6s ease", opacity: phase === "out" ? 0 : 1,
    }}>
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#0d2b27", border: "2px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: "0 0 40px rgba(74,222,128,0.15)" }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <line x1="10" y1="10" x2="42" y2="42" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="42" y1="10" x2="10" y2="42" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="8"  y1="26" x2="44" y2="26" stroke="white" strokeWidth="2"   strokeLinecap="round" opacity="0.7" />
        </svg>
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 400, letterSpacing: "0.35em", color: T.text, textTransform: "uppercase", marginBottom: 10 }}>
        Flexibility
      </div>
      <div style={{ fontSize: 13, color: T.textDim, letterSpacing: "0.08em", marginBottom: 52 }}>
        Inventory Management
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${T.accent}, #86efac)`, transition: "width 0.05s linear", boxShadow: `0 0 12px ${T.accent}` }} />
      </div>
    </div>
  );
}

// ─── Flexibility Logo ─────────────────────────────────────────────────────────
function FlexLogo({ size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#0d2b27", border: "1.5px solid rgba(74,222,128,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 52 52">
        <line x1="10" y1="10" x2="42" y2="42" stroke="white" strokeWidth="4"   strokeLinecap="round" />
        <line x1="42" y1="10" x2="10" y2="42" stroke="white" strokeWidth="4"   strokeLinecap="round" />
        <line x1="8"  y1="26" x2="44" y2="26" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
      </svg>
    </div>
  );
}

// ─── Sprach-Umschalter ────────────────────────────────────────────────────────
function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
      {["de", "en"].map(l => (
        <button key={l} onClick={() => setLang(l)} style={{ padding: "6px 12px", border: "none", cursor: "pointer", background: lang === l ? T.accentDim : "transparent", color: lang === l ? T.accent : T.textDim, fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.15s" }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, small = false }) {
  const { t } = useT();
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: small ? "2px 8px" : "4px 10px", borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.color}40`, color: cfg.color, fontSize: small ? 11 : 12, fontWeight: 600, letterSpacing: "0.03em", textShadow: `0 0 8px ${cfg.color}80` }}>
      {cfg.icon} {t(cfg.labelKey)}
    </span>
  );
}

// ─── Fortschrittsbalken ───────────────────────────────────────────────────────
function ProgressBar({ value, max, status, showPercent = false }) {
  const { t } = useT();
  const pct   = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = STATUS_CONFIG[status]?.color ?? T.accent;
  return (
    <div>
      <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, boxShadow: `0 0 8px ${color}80`, borderRadius: 99, transition: "width 0.5s ease" }} />
      </div>
      {showPercent && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: T.textDim }}>
          <span>{value} {t("detail.progress.of")} {max}</span>
          <span style={{ color }}>{pct}%</span>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, marginTop: 8 }}>
      {children}
    </div>
  );
}

// ─── Artikel-Karte ────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
  const { t, lang } = useT();
  const [hovered, setHovered] = useState(false);
  const status  = getStatus(product);
  const total   = product.lager + product.amazon_fba;
  const isEmpty = total === 0;

  return (
    <div
      onClick={() => onClick(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glass(), padding: "20px 22px", cursor: "pointer",
        opacity: isEmpty ? 0.3 : 1,
        transform: hovered && !isEmpty ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered && !isEmpty ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${STATUS_CONFIG[status].color}30` : "0 2px 12px rgba(0,0,0,0.25)",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: T.textDim, fontFamily: "monospace" }}>{product.id}</span>
            <span style={{ fontSize: 11, color: T.textDim, background: "rgba(255,255,255,0.07)", padding: "1px 6px", borderRadius: 4 }}>{product.kategorie}</span>
          </div>
        </div>
        <StatusBadge status={status} small />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        {[
          { labelKey: "card.warehouse", value: product.lager },
          { labelKey: "card.fba",       value: product.amazon_fba },
          { labelKey: "card.total",     value: total, accent: true },
        ].map(({ labelKey, value, accent }) => (
          <div key={labelKey} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: accent ? 22 : 18, fontWeight: 700, color: accent ? STATUS_CONFIG[status].color : T.text, textShadow: accent ? `0 0 12px ${STATUS_CONFIG[status].color}60` : "none", lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 3, letterSpacing: "0.04em" }}>{t(labelKey)}</div>
          </div>
        ))}
      </div>

      <ProgressBar value={total} max={product.min_bestand} status={status} />
      <div style={{ fontSize: 10, color: T.textDim, marginTop: 5 }}>
        {t("card.minStock")}: {product.min_bestand} {t("card.pcs")}
      </div>

      {product.ankunft && (
        <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 99, padding: "3px 10px", fontSize: 11, color: T.accent }}>
          📦 {t("card.arrival.prefix", { qty: product.ankunft_menge })} {new Date(product.ankunft).toLocaleDateString(DATE_LOCALE[lang], { day: "2-digit", month: "short" })}
        </div>
      )}
    </div>
  );
}

// ─── Detail-Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ product, onClose, onSave }) {
  const { t, lang } = useT();
  const [editing,   setEditing]   = useState(false);
  const [form,      setForm]      = useState({ ...product });
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [chartData] = useState(generateChartData);

  useEffect(() => { setForm({ ...product }); setEditing(false); setSaveError(null); }, [product]);

  const status = getStatus(form);
  const total  = form.lager + form.amazon_fba;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(form);
      setEditing(false);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Hilfsfunktion für Felder — readonly verhindert Bearbeitung (z.B. SKU = Primärschlüssel)
  const field = (label, key, type = "text", readonly = false) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{label}</div>
      {editing && !readonly ? (
        <input
          type={type}
          value={form[key] ?? ""}
          onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
          style={inputStyle}
        />
      ) : (
        <div style={{ fontSize: 14, color: readonly && editing ? T.textDim : T.text, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {form[key] || <span style={{ color: T.textDim }}>—</span>}
        </div>
      )}
    </div>
  );

  const last2  = chartData.slice(-2);
  const trend  = last2.length === 2 ? Math.round(((last2[1].verkauf - last2[0].verkauf) / (last2[0].verkauf || 1)) * 100) : 0;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />

      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(580px, 100vw)", zIndex: 101, background: "rgba(13,28,22,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.10)", display: "flex", flexDirection: "column", animation: "slideIn 0.25s ease", overflowY: "auto" }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          input:focus { border-color: rgba(74,222,128,0.5) !important; box-shadow: 0 0 0 2px rgba(74,222,128,0.15); }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        `}</style>

        {/* Sticky Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: "rgba(13,28,22,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 1 }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: T.textDim, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{form.name}</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 1, fontFamily: "monospace" }}>{form.id} · {form.asin}</div>
          </div>
          <StatusBadge status={status} />
          <button
            disabled={saving}
            onClick={() => { if (editing) handleSave(); else setEditing(true); }}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer", background: editing ? T.accent : T.accentDim, color: editing ? "#0d2b22" : T.accent, fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif", transition: "all 0.15s", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? t("detail.saving") : editing ? t("detail.save") : t("detail.edit")}
          </button>
          {editing && !saving && (
            <button onClick={() => { setForm({ ...product }); setEditing(false); setSaveError(null); }}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: T.textDim, cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
              {t("detail.cancel")}
            </button>
          )}
        </div>

        <div style={{ padding: "24px", flex: 1 }}>
          {/* Fehler-Meldung */}
          {saveError && (
            <div style={{ ...glass({ padding: "10px 14px" }), marginBottom: 16, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13 }}>
              {t("detail.saveError")} {saveError}
            </div>
          )}

          {/* KPI Karten */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              { labelKey: "detail.kpi.warehouse", value: form.lager,      color: T.text },
              { labelKey: "detail.kpi.fba",       value: form.amazon_fba, color: T.text },
              { labelKey: "detail.kpi.total",     value: total,           color: STATUS_CONFIG[status].color },
            ].map(({ labelKey, value, color }) => (
              <div key={labelKey} style={{ ...glass({ padding: "14px 16px", textAlign: "center" }) }}>
                <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 5 }}>{t(labelKey)}</div>
              </div>
            ))}
          </div>

          {/* Fortschrittsbalken */}
          <div style={{ ...glass({ padding: "16px 18px" }), marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: T.textDim, marginBottom: 10 }}>{t("detail.progress.label")}</div>
            <ProgressBar value={total} max={form.min_bestand} status={status} showPercent />
          </div>

          <SectionLabel>{t("detail.section.master")}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {field(t("detail.field.name"),     "name")}
            {field(t("detail.field.category"), "kategorie")}
            {field(t("detail.field.sku"),      "id",   "text", true /* SKU = Primärschlüssel, read-only */)}
            {field(t("detail.field.asin"),     "asin")}
          </div>

          <SectionLabel>{t("detail.section.stock")}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {field(t("detail.field.warehouse"), "lager",           "number")}
            {field(t("detail.field.fba"),       "amazon_fba",      "number")}
            {field(t("detail.field.reserved"),  "amazon_reserved", "number")}
            {field(t("detail.field.minStock"),  "min_bestand",     "number")}
          </div>

          <SectionLabel>{t("detail.section.logistics")}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {field(t("detail.field.orderUnit"),   "bestelleinheit",  "number")}
            {field(t("detail.field.leadTime"),    "lieferzeit_tage", "number")}
            {field(t("detail.field.arrivalDate"), "ankunft",         "date")}
            {field(t("detail.field.arrivalQty"),  "ankunft_menge",   "number")}
          </div>

          {form.ankunft && (
            <div style={{ ...glass({ padding: "14px 18px" }), marginBottom: 24, marginTop: 8, borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.07)" }}>
              <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, marginBottom: 6 }}>{t("detail.nextDelivery")}</div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: T.textDim }}>{t("detail.delivery.date")}</div>
                  <div style={{ fontSize: 14, color: T.text, marginTop: 2 }}>
                    {new Date(form.ankunft).toLocaleDateString(DATE_LOCALE[lang], { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: T.textDim }}>{t("detail.delivery.qty")}</div>
                  <div style={{ fontSize: 14, color: T.accent, fontWeight: 700, marginTop: 2 }}>+{form.ankunft_menge} {t("detail.delivery.pcs")}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
            {t("detail.chart.title")}
            <span style={{ marginLeft: 10, color: trend >= 0 ? T.accent : "#f87171", fontWeight: 600, textTransform: "none", fontSize: 12 }}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% {t("detail.chart.trend")}
            </span>
          </div>
          <div style={{ ...glass({ padding: "16px 8px" }) }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="monthIdx" tickFormatter={i => CHART_MONTHS[lang][i]} tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0d2b22", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: T.text, fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: T.textDim }} />
                <Bar dataKey="einkauf" name={t("detail.chart.purchase")} fill="rgba(74,222,128,0.7)" radius={[3,3,0,0]} />
                <Bar dataKey="verkauf" name={t("detail.chart.sales")}    fill="rgba(96,165,250,0.7)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Neuer-Artikel-Modal ──────────────────────────────────────────────────────
const EMPTY_PRODUCT = {
  id: "", name: "", asin: "", kategorie: "",
  lager: 0, amazon_fba: 0, amazon_reserved: 0,
  bestelleinheit: 50, lieferzeit_tage: 14,
  ankunft: null, ankunft_menge: 0, min_bestand: 0,
};

function NewProductModal({ existingIds, onClose, onCreated }) {
  const { t } = useT();
  const [form,     setForm]     = useState({ ...EMPTY_PRODUCT });
  const [creating, setCreating] = useState(false);
  const [error,    setError]    = useState(null);

  // Escape schließt Modal
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleCreate = async () => {
    if (!form.id.trim())   return setError(t("modal.err.skuRequired"));
    if (!form.name.trim()) return setError(t("modal.err.nameRequired"));
    if (existingIds.has(form.id.trim())) return setError(t("modal.err.skuExists"));

    setCreating(true);
    setError(null);
    try {
      const created = await onCreated({ ...form, id: form.id.trim(), name: form.name.trim() });
      onClose(created);
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  };

  const mfield = (label, key, type = "text") => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{label}</div>
      <input
        type={type}
        value={form[key] ?? ""}
        onChange={e => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
        style={inputStyle}
        disabled={creating}
      />
    </div>
  );

  return (
    <>
      <div onClick={() => onClose()} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", zIndex: 201,
        transform: "translate(-50%, -50%)",
        width: "min(520px, calc(100vw - 32px))",
        ...glass({ padding: 0 }),
        background: "rgba(13,28,22,0.98)",
        animation: "fadeUp 0.2s ease",
        overflow: "hidden",
      }}>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translate(-50%,-48%); } to { opacity:1; transform:translate(-50%,-50%); } }`}</style>

        {/* Modal Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, flex: 1 }}>{t("modal.title")}</div>
          <button onClick={() => onClose()} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: T.textDim, width: 30, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px" }}>
          {error && (
            <div style={{ ...glass({ padding: "9px 13px" }), marginBottom: 16, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {mfield(t("modal.field.sku"),      "id")}
            {mfield(t("modal.field.name"),     "name")}
            {mfield(t("modal.field.category"), "kategorie")}
            {mfield(t("modal.field.asin"),     "asin")}
            {mfield(t("modal.field.warehouse"),"lager",     "number")}
            {mfield(t("modal.field.minStock"), "min_bestand","number")}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => onClose()} disabled={creating} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: T.textDim, cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
            {t("modal.cancel")}
          </button>
          <button onClick={handleCreate} disabled={creating} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: creating ? "default" : "pointer", background: T.accent, color: "#0d2b22", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", opacity: creating ? 0.7 : 1, transition: "opacity 0.15s" }}>
            {creating ? t("modal.creating") : t("modal.create")}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Status-Ampel ─────────────────────────────────────────────────────────────
function StatusFilter({ products, active, onChange }) {
  const { t } = useT();
  const counts = {
    all:      products.length,
    ok:       products.filter(p => getStatus(p) === "ok").length,
    low:      products.filter(p => getStatus(p) === "low").length,
    critical: products.filter(p => getStatus(p) === "critical").length,
    out:      products.filter(p => getStatus(p) === "out").length,
    incoming: products.filter(p => p.ankunft).length,
  };
  const filters = [
    { key: "all",      labelKey: "filter.all",      icon: "≡",  count: counts.all },
    { key: "ok",       labelKey: "status.ok",       icon: "✓",  count: counts.ok,       color: "#4ade80" },
    { key: "low",      labelKey: "status.low",      icon: "⚠",  count: counts.low,      color: "#facc15" },
    { key: "critical", labelKey: "status.critical", icon: "✕",  count: counts.critical, color: "#f87171" },
    { key: "out",      labelKey: "status.out",      icon: "●",  count: counts.out,      color: "#ef4444" },
    { key: "incoming", labelKey: "filter.incoming", icon: "📦", count: counts.incoming, color: "#60a5fa" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "16px 24px" }}>
      {filters.map(({ key, labelKey, icon, count, color }) => {
        const isActive = active === key;
        return (
          <button key={key} onClick={() => onChange(isActive ? "all" : key)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 99, cursor: "pointer", background: isActive ? (color ? `${color}22` : T.accentDim) : "rgba(255,255,255,0.05)", border: `1px solid ${isActive ? (color || T.accent) + "55" : "rgba(255,255,255,0.10)"}`, color: isActive ? (color || T.accent) : T.textDim, fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily: "Inter, sans-serif", transition: "all 0.15s", boxShadow: isActive && color ? `0 0 12px ${color}30` : "none" }}>
            <span>{icon}</span>
            <span>{t(labelKey)}</span>
            <span style={{ background: isActive ? (color ? `${color}33` : T.accentDim) : "rgba(255,255,255,0.08)", color: isActive ? (color || T.accent) : T.textDim, padding: "1px 7px", borderRadius: 99, fontSize: 11 }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Lieferungen Tab ──────────────────────────────────────────────────────────
function LieferungenView({ products, onSelect }) {
  const { t, lang } = useT();
  const incoming = products.filter(p => p.ankunft).sort((a, b) => new Date(a.ankunft) - new Date(b.ankunft));

  if (incoming.length === 0) {
    return <div style={{ textAlign: "center", color: T.textDim, padding: "80px 24px" }}>{t("deliveries.empty")}</div>;
  }

  return (
    <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      {incoming.map(p => {
        const status    = getStatus(p);
        const total     = p.lager + p.amazon_fba;
        const daysUntil = Math.ceil((new Date(p.ankunft) - new Date()) / 86400000);
        const daysLabel = daysUntil === 0 ? t("deliveries.today") : daysUntil === 1 ? t("deliveries.tomorrow") : t("deliveries.inDays", { n: daysUntil });
        return (
          <div key={p.id} onClick={() => onSelect(p)}
            style={{ ...glass({ padding: "16px 20px" }), cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = T.glassHover}
            onMouseLeave={e => e.currentTarget.style.background = T.glass}
          >
            <div style={{ fontSize: 28, width: 40, textAlign: "center" }}>📦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
              <div style={{ fontSize: 12, color: T.textDim, fontFamily: "monospace" }}>{p.id}</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>+{p.ankunft_menge}</div>
              <div style={{ fontSize: 10, color: T.textDim }}>{t("deliveries.col.qty")}</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 80 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{new Date(p.ankunft).toLocaleDateString(DATE_LOCALE[lang], { day: "2-digit", month: "short" })}</div>
              <div style={{ fontSize: 11, color: daysUntil <= 3 ? "#facc15" : T.textDim }}>{daysLabel}</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <div style={{ fontSize: 14, color: T.text }}>{total}</div>
              <div style={{ fontSize: 10, color: T.textDim }}>{t("deliveries.col.current")}</div>
            </div>
            <StatusBadge status={status} small />
          </div>
        );
      })}
    </div>
  );
}

// ─── Haupt-App ────────────────────────────────────────────────────────────────
export default function App() {
  const [splashDone,      setSplashDone]      = useState(false);
  const [activeFilter,    setActiveFilter]    = useState("all");
  const [activeTab,       setActiveTab]       = useState("bestaende");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showNewModal,    setShowNewModal]     = useState(false);
  const [lang,            setLang]            = useState("de");
  const isMobile = useWindowWidth() < 640;
  const t        = useMemo(() => makeTFn(lang), [lang]);

  const { products, loading, error, reload, save, add } = useProducts();

  const handleSave = useCallback(async (updated) => {
    const saved = await save(updated);
    setSelectedProduct(saved);
    return saved;
  }, [save]);

  const handleAdd = useCallback(async (product) => {
    const created = await add(product);
    return created;
  }, [add]);

  const handleModalClose = (createdProduct) => {
    setShowNewModal(false);
    if (createdProduct?.id) setSelectedProduct(createdProduct);
  };

  const existingIds = useMemo(() => new Set(products.map(p => p.id)), [products]);

  const filtered = products.filter(p => {
    if (activeFilter === "all")      return true;
    if (activeFilter === "incoming") return !!p.ankunft;
    return getStatus(p) === activeFilter;
  });

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Inter, sans-serif", color: T.text }}>

        {/* ── Header ── */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(6,18,16,0.85)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: isMobile ? "10px 16px" : "12px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? 8 : 14 }}>
          <FlexLogo size={40} />
          <div style={{ lineHeight: 1.2, flex: isMobile ? 1 : "initial" }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em" }}>Flexibility</div>
            {!isMobile && <div style={{ fontSize: 11, color: T.textDim }}>{t("header.subtitle")}</div>}
          </div>
          {!isMobile && <div style={{ flex: 1 }} />}
          {isMobile  && <LangToggle />}

          <div style={{ display: "flex", gap: 6, alignItems: "center", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "initial" }}>
            <div style={{ display: "flex", gap: isMobile ? 2 : 6 }}>
              {[
                { key: "bestaende",   labelKey: "header.nav.stock" },
                { key: "lieferungen", labelKey: "header.nav.deliveries" },
              ].map(({ key, labelKey }) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{ padding: isMobile ? "7px 12px" : "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: activeTab === key ? T.accentDim : "transparent", color: activeTab === key ? T.accent : T.textDim, fontSize: isMobile ? 12 : 13, fontWeight: 500, fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}>
                  {t(labelKey)}
                </button>
              ))}
            </div>
            {!isMobile && <LangToggle />}
            <button onClick={() => setShowNewModal(true)} style={{ padding: isMobile ? "7px 12px" : "8px 16px", borderRadius: 9, border: `1px solid ${T.accent}55`, background: T.accentDim, color: T.accent, fontSize: isMobile ? 12 : 13, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
              {isMobile ? "+" : t("header.addItem")}
            </button>
          </div>
        </header>

        {/* ── Lade- / Fehlerzustand ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 24px", color: T.textDim }}>
            <div style={{ fontSize: 28, marginBottom: 12, animation: "spin 1.2s linear infinite", display: "inline-block" }}>⟳</div>
            <div>{t("app.loading")}</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ color: "#f87171", fontSize: 15, marginBottom: 16 }}>{t("app.error")}</div>
            <button onClick={reload} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${T.accent}55`, background: T.accentDim, color: T.accent, cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
              {t("app.retry")}
            </button>
          </div>
        )}

        {/* ── Seiten-Inhalt ── */}
        {!loading && !error && (
          activeTab === "bestaende" ? (
            <>
              <StatusFilter products={products} active={activeFilter} onChange={setActiveFilter} />
              <div style={{ padding: "0 24px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
                {filtered.length === 0 ? (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", color: T.textDim, padding: "60px 0" }}>{t("filter.empty")}</div>
                ) : (
                  filtered.map(p => <ProductCard key={p.id} product={p} onClick={setSelectedProduct} />)
                )}
              </div>
            </>
          ) : (
            <LieferungenView products={products} onSelect={p => { setSelectedProduct(p); setActiveTab("bestaende"); }} />
          )
        )}

        {/* ── Detail-Panel ── */}
        {selectedProduct && (
          <DetailPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} onSave={handleSave} />
        )}

        {/* ── Neuer-Artikel-Modal ── */}
        {showNewModal && (
          <NewProductModal existingIds={existingIds} onClose={handleModalClose} onCreated={handleAdd} />
        )}
      </div>
    </LangContext.Provider>
  );
}
