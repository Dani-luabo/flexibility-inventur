import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { supabase } from "./supabase";
import { loadAmazonCredentials, saveAmazonCredentials, triggerSync, lookupProduct } from "./lib/amazon";

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
    "detail.field.arrivalDate": "Bestelldatum",
    "detail.field.arrivalQty":  "Bestellmenge",
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
    "deliveries.received":      "angekommen",
    "deliveries.expected":      "erwartet",
    "deliveries.orderedOf":     "von {qty} bestellt",
    "deliveries.orderDate":     "Bestellt am",
    "deliveries.plannedDate":   "Erwartet am",
    "deliveries.arrivedDate":   "Angekommen am",
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
    "modal.field.price":        "Einkaufspreis (€)",
    "modal.err.skuRequired":    "SKU ist erforderlich.",
    "modal.err.nameRequired":   "Artikelname ist erforderlich.",
    "modal.err.skuExists":      "Diese SKU existiert bereits.",
    "delivery.modal.title":     "Neue Lieferung",
    "delivery.modal.product":   "Produkt",
    "delivery.modal.date":      "Bestelldatum",
    "delivery.modal.plannedDate": "Geplantes Lieferdatum (optional)",
    "delivery.modal.qty":       "Menge",
    "delivery.modal.save":      "Speichern",
    "delivery.modal.saving":    "Speichert...",
    "delivery.modal.cancel":    "Abbrechen",
    "delivery.modal.select":    "Produkt auswählen...",
    "delivery.modal.err.product": "Bitte ein Produkt auswählen.",
    "delivery.modal.err.date":  "Bitte ein Datum auswählen.",
    "delivery.modal.err.qty":   "Menge muss größer als 0 sein.",
    "delivery.modal.price":     "Einkaufspreis pro Stück (€)",
    "delivery.modal.priceHint": "Leer lassen wenn Preis unverändert",
    "delivery.addButton":       "+ Lieferung",
    "delivery.empty.cta":       "Lieferung planen",
    "detail.field.reorderPoint": "FBA Meldebestand",
    "detail.field.restockQty":  "Empf. Nachschub-Menge",
    "detail.section.reorder":   "Nachschub-Alert",
    "detail.days":              "Reichweite",
    "detail.days.unit":         "Tage",
    "detail.days.noData":       "Verfügbar nach Amazon Sync",
    "detail.chart.noData":      "Keine Verkaufsdaten — wird nach Amazon SP-API Verbindung angezeigt",
    "alert.reorder.title":      "Nachschub erforderlich",
    "alert.reorder.fba":        "FBA:",
    "alert.reorder.suggest":    "Empfohlen:",
    "alert.reorder.dismissAll": "Alle verbergen",
    "scanner.title":            "Barcode / ASIN scannen",
    "scanner.hint":             "Barcode in den Rahmen halten",
    "scanner.noCamera":         "Keine Kamera gefunden",
    "scanner.permissionDenied": "Kamera-Zugriff verweigert",
    "scanner.loading":          "Produkt wird gesucht...",
    "scanner.notFound":         "Produkt nicht gefunden",
    "scanner.useAnyway":        "Als Barcode verwenden",
    "scanner.retry":            "Erneut scannen",
    "scanner.noCredentials":    "SP-API nicht konfiguriert — Name manuell eingeben",
    "wre.status.pending":       "Ausstehend",
    "wre.status.partial":       "Teillieferung",
    "wre.status.complete":      "Vollständig",
    "wre.status.discrepancy":   "Differenz",
    "wre.book.button":          "Eingang buchen",
    "wre.book.correct":         "Korrigieren",
    "wre.book.title":           "Wareneingang buchen",
    "wre.book.ordered":         "Bestellt",
    "wre.book.received":        "Tatsächlich erhalten",
    "wre.book.previous":        "Vorheriger Eingang",
    "wre.book.stockChange":     "Lager-Änderung",
    "wre.book.save":            "Eingang buchen",
    "wre.book.saving":          "Bucht...",
    "wre.book.cancel":          "Abbrechen",
    "header.nav.settings":      "Einstellungen",
    "settings.title":           "Einstellungen",
    "settings.section.lwa":     "Login with Amazon (LWA)",
    "settings.section.marketplace": "Marketplace",
    "settings.section.aws":     "AWS Signatur (SigV4) — optional",
    "settings.field.clientId":  "Client ID",
    "settings.field.clientSecret": "Client Secret",
    "settings.field.refreshToken": "Refresh Token",
    "settings.field.marketplaceId": "Marketplace ID",
    "settings.field.region":    "AWS Region",
    "settings.field.awsAccessKey": "AWS Access Key ID",
    "settings.field.awsSecretKey": "AWS Secret Access Key",
    "settings.save":            "Speichern",
    "settings.saving":          "Speichert...",
    "settings.saved":           "Gespeichert ✓",
    "settings.saveError":       "Fehler beim Speichern:",
    "settings.hint.lwa":        "Client ID und Secret findest du in der Amazon SP-API Konsole unter deiner App.",
    "settings.hint.marketplace": "Standard DE: A1PA6795UKMFR9 — Standard US: ATVPDKIKX0DER",
    "settings.hint.aws":        "Nur benötigt wenn deine SP-API App IAM-Rollen verwendet.",
    "sync.button":              "Amazon Sync",
    "sync.running":             "Synchronisiert...",
    "sync.success":             "{updated} von {total} aktualisiert",
    "sync.error":               "Sync fehlgeschlagen",
    "sync.lastSync":            "Zuletzt:",
    "sync.notConfigured":       "Nicht konfiguriert",
    "detail.section.extra":     "Zusatzinfo",
    "detail.field.tags":        "Tags",
    "detail.field.notes":       "Notizen",
    "detail.field.lagerort":    "Lagerort",
    "detail.field.price":       "Einkaufspreis (€)",
    "detail.field.image":       "Produktbild",
    "detail.history.title":     "Lager-Verlauf",
    "detail.history.empty":     "Noch keine Änderungen aufgezeichnet.",
    "stats.title":              "Statistiken",
    "stats.totalValue":         "Gesamtwert",
    "stats.totalWarehouse":     "Lager gesamt",
    "stats.totalFBA":           "Amazon FBA gesamt",
    "stats.deliveriesMonth":    "Lieferungen diesen Monat",
    "stats.critical":           "Kritisch / Leer",
    "stats.currency":           "€",
    "stats.units":              "Stk.",
    "search.placeholder":       "Name, SKU, ASIN, Tags suchen...",
    "search.match.name":        "Name",
    "search.match.sku":         "SKU",
    "search.match.asin":        "ASIN",
    "search.match.category":    "Kategorie",
    "search.match.tags":        "Tag",
    "search.match.notes":       "Notizen",
    "search.match.lagerort":    "Lagerort",
    "filter.tag":               "Tag:",
    "tag.add.placeholder":      "Tag hinzufügen...",
    "image.upload":             "Bild hochladen",
    "image.uploading":          "Lädt hoch...",
    "image.change":             "Bild ändern",
    "history.reason.manual":    "Manuell",
    "history.reason.receipt":   "Wareneingang",
    "history.reason.fba":       "Zu Amazon FBA gesendet",
    "history.reason.correction":"Bestandskorrektur",
    "fba.modal.title":          "→ Amazon senden",
    "fba.modal.currentLager":   "Lagerbestand",
    "fba.modal.currentFba":     "FBA-Bestand",
    "fba.modal.qty":            "Zu sendende Menge",
    "fba.modal.btn":            "→ Amazon senden",
    "fba.modal.confirm":        "Senden",
    "fba.modal.cancel":         "Abbrechen",
    "fba.modal.saving":         "Wird gesendet...",
    "fba.modal.err.zero":       "Menge muss größer als 0 sein.",
    "fba.modal.err.overstock":  "Nicht genug Lagerbestand.",
    "correction.modal.title":   "Bestand korrigieren",
    "correction.modal.newLager":"Tatsächlicher Lagerbestand",
    "correction.modal.newFba":  "Tatsächlicher FBA-Bestand",
    "correction.modal.reason":  "Grund der Korrektur (optional)",
    "correction.modal.reasonHint": "z.B. Inventur, Schwund, Beschädigung",
    "correction.modal.defaultReason": "Manuelle Korrektur",
    "correction.modal.was":     "War:",
    "correction.modal.btn":     "Bestand korrigieren",
    "correction.modal.confirm": "Speichern",
    "correction.modal.cancel":  "Abbrechen",
    "correction.modal.saving":  "Speichert...",
    "correction.modal.err.negative": "Bestände können nicht negativ sein.",
    "correction.modal.err.noChange": "Keine Änderungen vorgenommen.",
    "fba.modal.tracking":            "Referenznummer / Tracking (optional)",
    "fba.modal.expectedArrival":     "Erwartete Ankunft bei Amazon (optional)",
    "fba.shipments.title":           "FBA Sendungen",
    "fba.shipments.empty":           "Noch keine Sendungen erfasst.",
    "fba.shipments.status.pending":  "Ausstehend",
    "fba.shipments.status.arrived":  "Angekommen",
    "fba.shipments.status.discrepancy": "Differenz",
    "fba.shipments.confirm.qty":     "Wie viele Einheiten hat Amazon bestätigt?",
    "fba.shipments.confirm.save":    "Bestätigen",
    "fba.shipments.confirm.cancel":  "Abbrechen",
    "fba.shipments.discrepancy":     "⚠ Differenz: {n} Stück fehlen bei Amazon!",
    "history.reason.fba_arrival":    "FBA Ankunft bestätigt",
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
    "detail.field.arrivalDate": "Order date",
    "detail.field.arrivalQty":  "Order qty.",
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
    "deliveries.received":      "received",
    "deliveries.expected":      "expected",
    "deliveries.orderedOf":     "of {qty} ordered",
    "deliveries.orderDate":     "Ordered on",
    "deliveries.plannedDate":   "Expected",
    "deliveries.arrivedDate":   "Arrived on",
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
    "modal.field.price":        "Purchase price (€)",
    "modal.err.skuRequired":    "SKU is required.",
    "modal.err.nameRequired":   "Item name is required.",
    "modal.err.skuExists":      "This SKU already exists.",
    "delivery.modal.title":     "New Delivery",
    "delivery.modal.product":   "Product",
    "delivery.modal.date":      "Order date",
    "delivery.modal.plannedDate": "Planned delivery date (optional)",
    "delivery.modal.qty":       "Quantity",
    "delivery.modal.save":      "Save",
    "delivery.modal.saving":    "Saving...",
    "delivery.modal.cancel":    "Cancel",
    "delivery.modal.select":    "Select a product...",
    "delivery.modal.err.product": "Please select a product.",
    "delivery.modal.err.date":  "Please select a date.",
    "delivery.modal.err.qty":   "Quantity must be greater than 0.",
    "delivery.modal.price":     "Purchase price per unit (€)",
    "delivery.modal.priceHint": "Leave empty to keep current price",
    "delivery.addButton":       "+ Delivery",
    "delivery.empty.cta":       "Schedule a delivery",
    "detail.field.reorderPoint": "FBA Reorder Point",
    "detail.field.restockQty":  "Recommended Restock Qty",
    "detail.section.reorder":   "Reorder Alert",
    "detail.days":              "Coverage",
    "detail.days.unit":         "days",
    "detail.days.noData":       "Available after Amazon Sync",
    "detail.chart.noData":      "No sales data yet — available after Amazon SP-API connection",
    "alert.reorder.title":      "Reorder Required",
    "alert.reorder.fba":        "FBA:",
    "alert.reorder.suggest":    "Recommended:",
    "alert.reorder.dismissAll": "Dismiss all",
    "scanner.title":            "Scan Barcode / ASIN",
    "scanner.hint":             "Hold barcode in frame",
    "scanner.noCamera":         "No camera found",
    "scanner.permissionDenied": "Camera access denied",
    "scanner.loading":          "Looking up product...",
    "scanner.notFound":         "Product not found",
    "scanner.useAnyway":        "Use as barcode",
    "scanner.retry":            "Scan again",
    "scanner.noCredentials":    "SP-API not configured — enter name manually",
    "wre.status.pending":       "Pending",
    "wre.status.partial":       "Partial",
    "wre.status.complete":      "Complete",
    "wre.status.discrepancy":   "Discrepancy",
    "wre.book.button":          "Book receipt",
    "wre.book.correct":         "Correct",
    "wre.book.title":           "Book Goods Receipt",
    "wre.book.ordered":         "Ordered",
    "wre.book.received":        "Actually received",
    "wre.book.previous":        "Previous receipt",
    "wre.book.stockChange":     "Stock change",
    "wre.book.save":            "Book receipt",
    "wre.book.saving":          "Saving...",
    "wre.book.cancel":          "Cancel",
    "header.nav.settings":      "Settings",
    "settings.title":           "Settings",
    "settings.section.lwa":     "Login with Amazon (LWA)",
    "settings.section.marketplace": "Marketplace",
    "settings.section.aws":     "AWS Signature (SigV4) — optional",
    "settings.field.clientId":  "Client ID",
    "settings.field.clientSecret": "Client Secret",
    "settings.field.refreshToken": "Refresh Token",
    "settings.field.marketplaceId": "Marketplace ID",
    "settings.field.region":    "AWS Region",
    "settings.field.awsAccessKey": "AWS Access Key ID",
    "settings.field.awsSecretKey": "AWS Secret Access Key",
    "settings.save":            "Save",
    "settings.saving":          "Saving...",
    "settings.saved":           "Saved ✓",
    "settings.saveError":       "Save failed:",
    "settings.hint.lwa":        "Find Client ID and Secret in the Amazon SP-API console under your app.",
    "settings.hint.marketplace": "Default DE: A1PA6795UKMFR9 — Default US: ATVPDKIKX0DER",
    "settings.hint.aws":        "Only needed if your SP-API app uses IAM roles.",
    "sync.button":              "Amazon Sync",
    "sync.running":             "Syncing...",
    "sync.success":             "{updated} of {total} updated",
    "sync.error":               "Sync failed",
    "sync.lastSync":            "Last sync:",
    "sync.notConfigured":       "Not configured",
    "detail.section.extra":     "Additional Info",
    "detail.field.tags":        "Tags",
    "detail.field.notes":       "Notes",
    "detail.field.lagerort":    "Location",
    "detail.field.price":       "Purchase Price (€)",
    "detail.field.image":       "Product Image",
    "detail.history.title":     "Stock History",
    "detail.history.empty":     "No changes recorded yet.",
    "stats.title":              "Statistics",
    "stats.totalValue":         "Total Value",
    "stats.totalWarehouse":     "Total Warehouse",
    "stats.totalFBA":           "Total Amazon FBA",
    "stats.deliveriesMonth":    "Deliveries this month",
    "stats.critical":           "Critical / Empty",
    "stats.currency":           "€",
    "stats.units":              "pcs.",
    "search.placeholder":       "Search name, SKU, ASIN, tags...",
    "search.match.name":        "Name",
    "search.match.sku":         "SKU",
    "search.match.asin":        "ASIN",
    "search.match.category":    "Category",
    "search.match.tags":        "Tag",
    "search.match.notes":       "Notes",
    "search.match.lagerort":    "Location",
    "filter.tag":               "Tag:",
    "tag.add.placeholder":      "Add tag...",
    "image.upload":             "Upload image",
    "image.uploading":          "Uploading...",
    "image.change":             "Change image",
    "history.reason.manual":    "Manual",
    "history.reason.receipt":   "Goods Receipt",
    "history.reason.fba":       "Sent to Amazon FBA",
    "history.reason.correction":"Stock Correction",
    "fba.modal.title":          "→ Send to Amazon",
    "fba.modal.currentLager":   "Warehouse Stock",
    "fba.modal.currentFba":     "FBA Stock",
    "fba.modal.qty":            "Units to send",
    "fba.modal.btn":            "→ Send to Amazon",
    "fba.modal.confirm":        "Send",
    "fba.modal.cancel":         "Cancel",
    "fba.modal.saving":         "Sending...",
    "fba.modal.err.zero":       "Quantity must be greater than 0.",
    "fba.modal.err.overstock":  "Not enough warehouse stock.",
    "correction.modal.title":   "Correct Stock",
    "correction.modal.newLager":"Actual Warehouse Stock",
    "correction.modal.newFba":  "Actual FBA Stock",
    "correction.modal.reason":  "Reason (optional)",
    "correction.modal.reasonHint": "e.g. Inventory count, Loss, Damage",
    "correction.modal.defaultReason": "Manual correction",
    "correction.modal.was":     "Was:",
    "correction.modal.btn":     "Correct Stock",
    "correction.modal.confirm": "Save",
    "correction.modal.cancel":  "Cancel",
    "correction.modal.saving":  "Saving...",
    "correction.modal.err.negative": "Stock cannot be negative.",
    "correction.modal.err.noChange": "No changes made.",
    "fba.modal.tracking":            "Reference / Tracking (optional)",
    "fba.modal.expectedArrival":     "Expected arrival at Amazon (optional)",
    "fba.shipments.title":           "FBA Shipments",
    "fba.shipments.empty":           "No shipments tracked yet.",
    "fba.shipments.status.pending":  "Pending",
    "fba.shipments.status.arrived":  "Arrived",
    "fba.shipments.status.discrepancy": "Discrepancy",
    "fba.shipments.confirm.qty":     "How many units did Amazon confirm?",
    "fba.shipments.confirm.save":    "Confirm",
    "fba.shipments.confirm.cancel":  "Cancel",
    "fba.shipments.discrepancy":     "⚠ Discrepancy: {n} units missing at Amazon!",
    "history.reason.fba_arrival":    "FBA arrival confirmed",
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
    if (error) {
      console.error("[DB] products.upsert FAILED", { code: error.code, msg: error.message, details: error.details, hint: error.hint, product_id: product.id });
      throw new Error(`[products.upsert] ${error.message}`);
    }
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
    if (error) {
      console.error("[DB] products.insert FAILED", { code: error.code, msg: error.message, details: error.details, hint: error.hint });
      throw new Error(`[products.insert] ${error.message}`);
    }
    setProducts(ps => [...ps, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  }, []);

  return { products, loading, error, reload: load, save, add };
}

// ─── Amazon-Settings-Hook ─────────────────────────────────────────────────────
function useAmazonSettings() {
  const [creds,     setCreds]     = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [syncState, setSyncState] = useState({ status: "idle", message: null, lastSync: null });

  const load = useCallback(async () => {
    setSettingsLoading(true);
    try {
      // Load all settings rows including last_sync
      const { data } = await supabase.from("settings").select("key, value")
        .in("key", ["amazon_client_id","amazon_client_secret","amazon_refresh_token",
                    "amazon_marketplace_id","amazon_aws_access_key","amazon_aws_secret_key",
                    "amazon_region","amazon_last_sync"]);
      if (!data?.length) { setCreds(null); setSettingsLoading(false); return; }
      const c = Object.fromEntries(data.map(r => [r.key, r.value]));
      if (c.amazon_last_sync) setSyncState(s => ({ ...s, lastSync: c.amazon_last_sync }));
      if (!c.amazon_client_id || !c.amazon_client_secret || !c.amazon_refresh_token) {
        setCreds(null);
      } else {
        setCreds(c);
      }
    } catch (_) { setCreds(null); }
    setSettingsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveCreds = useCallback(async (newCreds) => {
    await saveAmazonCredentials(newCreds);
    await load();
  }, [load]);

  const sync = useCallback(async (onReload) => {
    setSyncState(s => ({ ...s, status: "running", message: null }));
    try {
      const result = await triggerSync();
      setSyncState({ status: "success", message: result, lastSync: result.syncedAt });
      onReload?.();
    } catch (e) {
      setSyncState(s => ({ ...s, status: "error", message: e.message }));
    }
  }, []);

  return { creds, settingsLoading, saveCreds, sync, syncState };
}

// ─── Supabase: Lieferungen-Hook ───────────────────────────────────────────────
function useDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("deliveries").select("*").order("arrival_date");
    setDeliveries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Plan lieferung: create/update delivery record with order_date + planned_arrival_date
  const plan = useCallback(async (productId, orderDate, orderedQty, plannedArrivalDate, preisProStueck) => {
    const { data: existing, error: selErr } = await supabase
      .from("deliveries")
      .select("id")
      .eq("product_id", productId)
      .eq("arrival_date", orderDate)
      .maybeSingle();
    if (selErr) console.warn("[DB] deliveries.select (plan)", { code: selErr.code, msg: selErr.message });

    const priceField = preisProStueck > 0 ? { einkaufspreis_pro_stueck: preisProStueck } : {};

    if (existing) {
      const { error } = await supabase.from("deliveries")
        .update({ ordered_quantity: orderedQty, order_date: orderDate, planned_arrival_date: plannedArrivalDate || null, ...priceField })
        .eq("id", existing.id);
      if (error) console.error("[DB] deliveries.update (plan) FAILED", { code: error.code, msg: error.message, details: error.details });
    } else {
      const { error } = await supabase.from("deliveries")
        .insert({ product_id: productId, arrival_date: orderDate, ordered_quantity: orderedQty, order_date: orderDate, planned_arrival_date: plannedArrivalDate || null, ...priceField });
      if (error) console.error("[DB] deliveries.insert (plan) FAILED", { code: error.code, msg: error.message, details: error.details });
    }
    await load();
  }, [load]);

  // Wareneingang buchen: upsert delivery record by product_id + arrival_date
  const book = useCallback(async (productId, arrivalDate, orderedQty, receivedQty) => {
    const today = new Date().toISOString().split("T")[0];

    const { data: existing, error: selErr } = await supabase
      .from("deliveries")
      .select("id, received_quantity, planned_arrival_date")
      .eq("product_id", productId)
      .eq("arrival_date", arrivalDate)
      .maybeSingle();
    if (selErr) console.warn("[DB] deliveries.select (book)", { code: selErr.code, msg: selErr.message });

    if (existing) {
      const { error } = await supabase
        .from("deliveries")
        .update({ received_quantity: receivedQty, received_date: today, ordered_quantity: orderedQty, order_date: arrivalDate })
        .eq("id", existing.id);
      if (error) {
        console.error("[DB] deliveries.update (book) FAILED", { code: error.code, msg: error.message, details: error.details });
        throw new Error(`[deliveries.update] ${error.message}`);
      }
      return { previousReceived: existing.received_quantity ?? 0 };
    } else {
      const { error } = await supabase
        .from("deliveries")
        .insert({ product_id: productId, arrival_date: arrivalDate, ordered_quantity: orderedQty, received_quantity: receivedQty, received_date: today, order_date: arrivalDate });
      if (error) {
        console.error("[DB] deliveries.insert (book) FAILED", { code: error.code, msg: error.message, details: error.details });
        throw new Error(`[deliveries.insert] ${error.message}`);
      }
      return { previousReceived: 0 };
    }
  }, []);

  return { deliveries, loading, reload: load, book, plan };
}

// ─── Supabase: Lager-Verlauf Hook ─────────────────────────────────────────────
function useStockHistory(productId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stock_history")
        .select("*")
        .eq("product_id", productId)
        .order("changed_at", { ascending: false })
        .limit(30);
      if (error) console.warn("[DB] stock_history.select FAILED", { code: error.code, msg: error.message });
      else setHistory(data ?? []);
    } catch (e) { console.warn("[DB] stock_history.select exception", e.message); }
    setLoading(false);
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const write = useCallback(async (entries) => {
    if (!entries.length) return;
    try {
      const { error } = await supabase.from("stock_history").insert(entries);
      if (error) console.warn("[DB] stock_history.insert FAILED", { code: error.code, msg: error.message });
      else await load();
    } catch (e) { console.warn("[DB] stock_history.insert exception", e.message); }
  }, [load]);

  return { history, loading, write, reload: load };
}

// ─── Supabase: FBA Sendungen Hook ─────────────────────────────────────────────
function useFbaShipments(productId) {
  const [shipments, setShipments] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!productId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fba_shipments")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) console.warn("[DB] fba_shipments.select FAILED", { code: error.code, msg: error.message });
      setShipments(data ?? []);
    } catch (e) { console.warn("[DB] fba_shipments.select exception", e.message); }
    setLoading(false);
  }, [productId]);

  useEffect(() => { load(); }, [load]);
  return { shipments, loading, reload: load };
}

// ─── Produktbild: client-side resize → base64 (no Storage bucket needed) ────
function readImageAsBase64(file, maxPx = 600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Tag-Farben ───────────────────────────────────────────────────────────────
const TAG_PALETTE = ["#60a5fa","#4ade80","#fb923c","#f472b6","#a78bfa","#facc15","#34d399","#f87171"];
function tagColor(tag) {
  let h = 5381;
  for (let i = 0; i < tag.length; i++) h = (Math.imul(h, 31) + tag.charCodeAt(i)) | 0;
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length];
}

// ─── Such-Hilfe ───────────────────────────────────────────────────────────────
function getSearchMatch(product, query) {
  if (!query) return null;
  const q = query.toLowerCase();
  if (product.name?.toLowerCase().includes(q)) return "name";
  if (product.id?.toLowerCase().includes(q))   return "sku";
  if (product.asin?.toLowerCase().includes(q)) return "asin";
  if (product.kategorie?.toLowerCase().includes(q)) return "category";
  if ((product.tags ?? []).some(t => t.toLowerCase().includes(q))) return "tags";
  if (product.notes?.toLowerCase().includes(q)) return "notes";
  if (product.lagerort?.toLowerCase().includes(q)) return "lagerort";
  return null;
}

// ─── Chart-Platzhalterdaten ───────────────────────────────────────────────────
const generateChartData = (productId = "x") => {
  const rand = makeRand(seedRandom(productId));
  return Array.from({ length: 12 }, (_, i) => ({
    monthIdx: i,
    einkauf: Math.floor(rand() * 120) + 20,
    verkauf: Math.floor(rand() * 100) + 10,
  }));
};

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

// ─── Wareneingang Status ──────────────────────────────────────────────────────
const WRE_STATUS = {
  pending:     { labelKey: "wre.status.pending",     color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: "○" },
  partial:     { labelKey: "wre.status.partial",     color: "#facc15", bg: "rgba(250,204,21,0.13)",  icon: "◑" },
  complete:    { labelKey: "wre.status.complete",    color: "#4ade80", bg: "rgba(74,222,128,0.13)",  icon: "✓" },
  discrepancy: { labelKey: "wre.status.discrepancy", color: "#fb923c", bg: "rgba(251,146,60,0.13)",  icon: "≠" },
};

function getWreStatus(deliveries, productId, arrivalDate, orderedQty) {
  const rec = deliveries.find(d => d.product_id === productId && d.arrival_date === arrivalDate);
  if (!rec || !rec.received_quantity) return "pending";
  if (rec.received_quantity === orderedQty) return "complete";
  return "discrepancy";
}

// ─── Seeded-Random & Reichweite-Helpers ──────────────────────────────────────
function seedRandom(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x9e3779b1) | 0;
  return Math.abs(h);
}

function makeRand(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
}

function getDaysRemaining(product) {
  const total = (product.lager ?? 0) + (product.amazon_fba ?? 0);
  if (total === 0) return 0;
  const rand = makeRand(seedRandom(product.id ?? "x"));
  const avgMonthly = Array.from({ length: 12 }, () => Math.floor(rand() * 100) + 10)
    .reduce((a, b) => a + b, 0) / 12;
  const daily = avgMonthly / 30;
  return Math.round(total / daily);
}

function daysColor(days) {
  if (days > 30) return "#4ade80";
  if (days >= 10) return "#facc15";
  return "#f87171";
}

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

// ─── Wareneingang Status Badge ────────────────────────────────────────────────
function WreStatusBadge({ status }) {
  const { t } = useT();
  const cfg = WRE_STATUS[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.color}40`, color: cfg.color, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
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
function ProductCard({ product, onClick, searchMatch, delivery, fbaTransfer }) {
  const { t, lang } = useT();
  const [hovered, setHovered] = useState(false);
  const status      = getStatus(product);
  const total       = product.lager + product.amazon_fba;
  const isEmpty     = total === 0;
  const needsReorder = (product.meldebestand_fba ?? 0) > 0 && product.amazon_fba < (product.meldebestand_fba ?? 0);
  const hasTags     = (product.tags ?? []).length > 0;

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
        {/* Thumbnail */}
        {(product.image_data || product.image_url) && (
          <div style={{ width: 46, height: 46, borderRadius: 8, overflow: "hidden", flexShrink: 0, marginRight: 10, border: "1px solid rgba(255,255,255,0.10)" }}>
            <img src={product.image_data || product.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" loading="lazy" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: T.textDim, fontFamily: "monospace" }}>{product.id}</span>
            <span style={{ fontSize: 11, color: T.textDim, background: "rgba(255,255,255,0.07)", padding: "1px 6px", borderRadius: 4 }}>{product.kategorie}</span>
            {product.lagerort && <span style={{ fontSize: 10, color: T.textDim }}>📍 {product.lagerort}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0, marginLeft: 6 }}>
          {product.notes && <span style={{ fontSize: 12, opacity: 0.7 }} title="Notizen">📝</span>}
          {needsReorder && (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444", display: "inline-block" }} title="Nachschub erforderlich" />
          )}
          <StatusBadge status={status} small />
        </div>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
        <div style={{ fontSize: 10, color: T.textDim }}>
          {t("card.minStock")}: {product.min_bestand} {t("card.pcs")}
        </div>
        {(product.einkaufspreis ?? 0) > 0 && (
          <div style={{ fontSize: 10, color: T.textDim, fontVariantNumeric: "tabular-nums" }}>
            Warenwert € {((product.lager + product.amazon_fba) * product.einkaufspreis).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
        {product.ankunft && (() => {
          const rec = delivery;
          const received  = rec?.received_quantity ?? 0;
          const ordered   = product.ankunft_menge;
          const orderDate = new Date(product.ankunft).toLocaleDateString(DATE_LOCALE[lang], { day: "2-digit", month: "short" });
          if (received > 0 && received === ordered) {
            return (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.30)", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#4ade80", fontWeight: 600 }}>
                ✓ {received} {t("deliveries.received")}
              </span>
            );
          }
          if (received > 0 && received !== ordered) {
            return (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(251,146,60,0.10)", border: "1px solid rgba(251,146,60,0.30)", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#fb923c", fontWeight: 600 }}>
                ⚠ {received} {t("deliveries.orderedOf", { qty: ordered })}
              </span>
            );
          }
          return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#60a5fa" }}>
              📦 +{ordered} {t("deliveries.expected")} · {orderDate}
            </span>
          );
        })()}
        {(product.tags ?? []).map(tag => (
          <span key={tag} style={{ display: "inline-flex", alignItems: "center", background: `${tagColor(tag)}18`, border: `1px solid ${tagColor(tag)}35`, borderRadius: 99, padding: "2px 8px", fontSize: 10, color: tagColor(tag), fontWeight: 600 }}>
            {tag}
          </span>
        ))}
        {fbaTransfer > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.30)", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>
            → {fbaTransfer} Stk. zu Amazon
          </span>
        )}
        {searchMatch && (
          <span style={{ display: "inline-flex", alignItems: "center", background: "rgba(250,204,21,0.10)", border: "1px solid rgba(250,204,21,0.3)", borderRadius: 99, padding: "2px 8px", fontSize: 10, color: "#facc15" }}>
            ↳ {t(`search.match.${searchMatch}`)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Detail-Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ product, onClose, onSave, onFbaTransfer, onStockCorrection, onFbaArrival }) {
  const { t, lang } = useT();
  const [editing,        setEditing]        = useState(false);
  const [form,           setForm]           = useState({ ...product });
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState(null);
  const [scanning,       setScanning]       = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [tagInput,       setTagInput]       = useState("");
  const [confirmingId,   setConfirmingId]   = useState(null);
  const [confirmedQty,   setConfirmedQty]   = useState(0);
  const [confirmSaving,  setConfirmSaving]  = useState(false);
  const [confirmError,   setConfirmError]   = useState(null);
  const { history, loading: histLoading }   = useStockHistory(product.id);
  const { shipments, loading: shipmentsLoading, reload: reloadShipments } = useFbaShipments(product.id);

  useEffect(() => { setForm({ ...product }); setEditing(false); setSaveError(null); setTagInput(""); }, [product]);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected
    e.target.value = "";
    setImageUploading(true);
    setSaveError(null);
    try {
      const base64 = await readImageAsBase64(file);
      setForm(f => ({ ...f, image_data: base64 }));
      // Save only image_data directly — avoids full save flow so edit mode is unaffected
      const { error } = await supabase.from("products").update({ image_data: base64 }).eq("id", form.id);
      if (error) {
        console.error("[DB] products.update image_data FAILED", { code: error.code, msg: error.message });
        throw new Error(`[products.update] ${error.message}`);
      }
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const addTag = (raw) => {
    const tag = raw.trim().replace(/,/g, "");
    if (!tag || (form.tags ?? []).includes(tag)) return;
    setForm(f => ({ ...f, tags: [...(f.tags ?? []), tag] }));
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: (f.tags ?? []).filter(t => t !== tag) }));

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

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />

      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(580px, 100vw)", zIndex: 101, background: "rgba(13,28,22,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.10)", display: "flex", flexDirection: "column", animation: "slideIn 0.25s ease", overflowY: "auto" }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          input:focus, textarea:focus { border-color: rgba(74,222,128,0.5) !important; box-shadow: 0 0 0 2px rgba(74,222,128,0.15); }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
          .img-hover-overlay { opacity: 0; transition: opacity 0.2s; }
          .img-hover-wrap:hover .img-hover-overlay { opacity: 1; }
        `}</style>

        {/* Sticky Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: "rgba(13,28,22,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 1 }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: T.textDim, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          {/* Thumbnail in header */}
          {(form.image_data || form.image_url) && (
            <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)" }}>
              <img src={form.image_data || form.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            </div>
          )}
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
            <button onClick={() => { setForm({ ...product }); setEditing(false); setSaveError(null); setTagInput(""); }}
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

          {/* Produktbild — always clickable, no edit mode required */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            {(form.image_data || form.image_url) ? (
              <label className="img-hover-wrap" style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
                <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleImageUpload} disabled={imageUploading} />
                <img src={form.image_data || form.image_url} style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", display: "block" }} alt="" />
                <div className="img-hover-overlay" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", borderRadius: 12, gap: 6 }}>
                  <span style={{ fontSize: 20 }}>📷</span>
                  <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{imageUploading ? t("image.uploading") : t("image.change")}</span>
                </div>
              </label>
            ) : (
              <label style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 100, height: 100, borderRadius: 12, border: `2px dashed ${T.accent}55`, cursor: imageUploading ? "default" : "pointer", background: T.accentDim, gap: 6, transition: "all 0.2s" }}
                onMouseEnter={e => { if (!imageUploading) { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = "rgba(74,222,128,0.2)"; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${T.accent}55`; e.currentTarget.style.background = T.accentDim; }}
              >
                <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleImageUpload} disabled={imageUploading} />
                <span style={{ fontSize: 28 }}>📷</span>
                <span style={{ fontSize: 10, color: T.accent, fontWeight: 600, textAlign: "center" }}>{imageUploading ? t("image.uploading") : t("image.upload")}</span>
              </label>
            )}
          </div>

          {/* KPI Karten */}
          {(() => {
            const kpis = [
              { labelKey: "detail.kpi.warehouse", value: form.lager,      color: T.text },
              { labelKey: "detail.kpi.fba",       value: form.amazon_fba, color: T.text },
              { labelKey: "detail.kpi.total",     value: total,           color: STATUS_CONFIG[status].color },
            ];
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
                {kpis.map(({ labelKey, value, color }) => (
                  <div key={labelKey} style={{ ...glass({ padding: "12px 14px", textAlign: "center" }) }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 5 }}>{t(labelKey)}</div>
                  </div>
                ))}
                <div style={{ ...glass({ padding: "10px 8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }) }}>
                  <div style={{ fontSize: 16, color: T.textDim, lineHeight: 1 }}>—</div>
                  <div style={{ fontSize: 9, color: T.textDim, marginTop: 6, lineHeight: 1.4 }}>{t("detail.days.noData")}</div>
                </div>
              </div>
            );
          })()}

          {/* Fortschrittsbalken */}
          <div style={{ ...glass({ padding: "16px 18px" }), marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textDim, marginBottom: 10 }}>{t("detail.progress.label")}</div>
            <ProgressBar value={total} max={form.min_bestand} status={status} showPercent />
          </div>

          {/* Lager-Aktionen */}
          {!editing && (
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <button
                onClick={onFbaTransfer}
                disabled={form.lager <= 0}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.06)", color: form.lager > 0 ? T.accent : T.textDim, cursor: form.lager > 0 ? "pointer" : "default", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", opacity: form.lager <= 0 ? 0.4 : 1, transition: "all 0.15s", textAlign: "center" }}
              >
                {t("fba.modal.btn")}
              </button>
              <button
                onClick={onStockCorrection}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.06)", color: "#f59e0b", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", transition: "all 0.15s", textAlign: "center" }}
              >
                {t("correction.modal.btn")}
              </button>
            </div>
          )}

          <SectionLabel>{t("detail.section.master")}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {field(t("detail.field.name"),     "name")}
            {field(t("detail.field.category"), "kategorie")}
            {field(t("detail.field.sku"),      "id",   "text", true)}
            {/* ASIN — scannable */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{t("detail.field.asin")}</div>
              {editing ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="text" value={form.asin ?? ""} onChange={e => setForm(f => ({ ...f, asin: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => setScanning(true)} title={t("scanner.title")} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: T.textDim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 14, color: T.text, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {form.asin || <span style={{ color: T.textDim }}>—</span>}
                </div>
              )}
            </div>
          </div>
          {scanning && <AsinScanner onScan={r => { setForm(f => ({ ...f, asin: r.asin ?? r, ...(r.name ? { name: r.name } : {}), ...(r.category ? { kategorie: r.category } : {}) })); setScanning(false); }} onClose={() => setScanning(false)} />}

          <SectionLabel>{t("detail.section.stock")}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {field(t("detail.field.warehouse"), "lager",           "number")}
            {field(t("detail.field.fba"),       "amazon_fba",      "number")}
            {field(t("detail.field.reserved"),  "amazon_reserved", "number")}
            {field(t("detail.field.minStock"),  "min_bestand",     "number")}
            {field(t("detail.field.price"),     "einkaufspreis",   "number")}
          </div>

          <SectionLabel>{t("detail.section.logistics")}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {field(t("detail.field.orderUnit"),   "bestelleinheit",  "number")}
            {field(t("detail.field.leadTime"),    "lieferzeit_tage", "number")}
            {field(t("detail.field.arrivalDate"), "ankunft",         "date")}
            {field(t("detail.field.arrivalQty"),  "ankunft_menge",   "number")}
          </div>

          <SectionLabel>{t("detail.section.reorder")}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {field(t("detail.field.reorderPoint"), "meldebestand_fba", "number")}
            {field(t("detail.field.restockQty"),   "nachschub_menge",  "number")}
          </div>

          {/* ── Zusatzinfo ── */}
          <SectionLabel>{t("detail.section.extra")}</SectionLabel>

          {/* Tags */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, letterSpacing: "0.04em" }}>{t("detail.field.tags")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {(form.tags ?? []).map(tag => (
                <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${tagColor(tag)}18`, border: `1px solid ${tagColor(tag)}40`, borderRadius: 99, padding: "3px 10px", fontSize: 11, color: tagColor(tag), fontWeight: 600 }}>
                  {tag}
                  {editing && (
                    <button onClick={() => removeTag(tag)} style={{ background: "none", border: "none", cursor: "pointer", color: tagColor(tag), fontSize: 13, lineHeight: 1, padding: "0 0 0 2px", opacity: 0.7, fontFamily: "Inter, sans-serif" }}>×</button>
                  )}
                </span>
              ))}
              {editing && (
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                      e.preventDefault();
                      addTag(tagInput);
                      setTagInput("");
                    }
                  }}
                  onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(""); } }}
                  placeholder={t("tag.add.placeholder")}
                  style={{ ...inputStyle, width: "auto", minWidth: 140, padding: "3px 10px", fontSize: 11, borderRadius: 99 }}
                />
              )}
              {!(form.tags ?? []).length && !editing && <span style={{ fontSize: 12, color: T.textDim }}>—</span>}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{t("detail.field.notes")}</div>
            {editing ? (
              <textarea
                value={form.notes ?? ""}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.6 }}
              />
            ) : (
              <div style={{ fontSize: 13, color: form.notes ? T.text : T.textDim, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {form.notes || "—"}
              </div>
            )}
          </div>

          {field(t("detail.field.lagerort"), "lagerort")}

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
          </div>
          <div style={{ ...glass({ padding: "40px 24px", textAlign: "center" }), marginBottom: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.25 }}>📊</div>
            <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6 }}>{t("detail.chart.noData")}</div>
          </div>

          {/* ── FBA Sendungen ── */}
          <SectionLabel>{t("fba.shipments.title")}</SectionLabel>
          <div style={{ ...glass({ padding: "14px 16px" }), marginBottom: 20 }}>
            {shipmentsLoading ? (
              <div style={{ color: T.textDim, fontSize: 12 }}>…</div>
            ) : shipments.length === 0 ? (
              <div style={{ color: T.textDim, fontSize: 12 }}>{t("fba.shipments.empty")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {shipments.map(s => {
                  const sentDate = s.sent_date
                    ? new Date(s.sent_date).toLocaleDateString(DATE_LOCALE[lang], { day: "2-digit", month: "2-digit", year: "numeric" })
                    : "—";
                  const expectedDate = s.expected_arrival
                    ? new Date(s.expected_arrival).toLocaleDateString(DATE_LOCALE[lang], { day: "2-digit", month: "short" })
                    : null;
                  const statusColors = {
                    pending:     { bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.25)",  text: "#facc15" },
                    arrived:     { bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.25)",  text: "#4ade80" },
                    discrepancy: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", text: "#f87171" },
                  };
                  const sc = statusColors[s.status] ?? statusColors.pending;
                  const statusLabel = {
                    pending:     t("fba.shipments.status.pending"),
                    arrived:     t("fba.shipments.status.arrived"),
                    discrepancy: t("fba.shipments.status.discrepancy"),
                  }[s.status] ?? s.status;
                  const isConfirming = confirmingId === s.id;
                  const diff = s.confirmed_quantity != null ? s.sent_quantity - s.confirmed_quantity : 0;

                  return (
                    <div key={s.id} style={{ borderRadius: 8, border: `1px solid ${sc.border}`, background: sc.bg, padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.sent_quantity} Stk.</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: sc.text, background: "rgba(0,0,0,0.25)", padding: "2px 7px", borderRadius: 20, border: `1px solid ${sc.border}` }}>
                              {statusLabel}
                            </span>
                            <span style={{ fontSize: 10, color: T.textDim }}>{sentDate}</span>
                            {expectedDate && s.status === "pending" && (
                              <span style={{ fontSize: 10, color: T.textDim }}>→ {expectedDate}</span>
                            )}
                          </div>
                          {s.tracking_reference && (
                            <div style={{ fontSize: 11, color: T.textDim, fontFamily: "monospace" }}>{s.tracking_reference}</div>
                          )}
                          {s.status === "discrepancy" && diff > 0 && (
                            <div style={{ fontSize: 11, color: "#f87171", fontWeight: 600, marginTop: 4 }}>
                              {t("fba.shipments.discrepancy").replace("{n}", diff)}
                            </div>
                          )}
                          {s.status === "arrived" && s.confirmed_quantity != null && s.confirmed_quantity !== s.sent_quantity && (
                            <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
                              Bestätigt: {s.confirmed_quantity} Stk.
                            </div>
                          )}
                        </div>
                        {s.status === "pending" && !isConfirming && (
                          <button
                            onClick={() => { setConfirmingId(s.id); setConfirmedQty(s.sent_quantity); setConfirmError(null); }}
                            style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.08)", color: "#4ade80", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                          >
                            ✓ {t("fba.shipments.confirm.save")}
                          </button>
                        )}
                      </div>

                      {isConfirming && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          {confirmError && (
                            <div style={{ fontSize: 11, color: "#f87171", marginBottom: 8 }}>{confirmError}</div>
                          )}
                          <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6 }}>{t("fba.shipments.confirm.qty")}</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input
                              type="number" min={0} max={s.sent_quantity}
                              value={confirmedQty}
                              onChange={e => setConfirmedQty(Number(e.target.value))}
                              style={{ ...inputStyle, width: 80, textAlign: "center", padding: "6px 8px", fontSize: 14, fontWeight: 700 }}
                              autoFocus
                            />
                            <span style={{ fontSize: 11, color: T.textDim }}>/ {s.sent_quantity} gesendet</span>
                            <button
                              onClick={async () => {
                                setConfirmSaving(true); setConfirmError(null);
                                try {
                                  await onFbaArrival(product, s.id, confirmedQty, s.sent_quantity);
                                  setConfirmingId(null);
                                  await reloadShipments();
                                } catch (e) { setConfirmError(e.message); }
                                setConfirmSaving(false);
                              }}
                              disabled={confirmSaving}
                              style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 6, border: "none", background: "#4ade80", color: "#0d2b22", cursor: confirmSaving ? "default" : "pointer", opacity: confirmSaving ? 0.6 : 1, fontFamily: "Inter, sans-serif" }}
                            >
                              {confirmSaving ? "…" : t("fba.shipments.confirm.save")}
                            </button>
                            <button
                              onClick={() => { setConfirmingId(null); setConfirmError(null); }}
                              disabled={confirmSaving}
                              style={{ fontSize: 11, padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: T.textDim, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                            >
                              {t("fba.shipments.confirm.cancel")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Lager-Verlauf ── */}
          <SectionLabel>{t("detail.history.title")}</SectionLabel>
          <div style={{ ...glass({ padding: "14px 16px" }) }}>
            {histLoading ? (
              <div style={{ color: T.textDim, fontSize: 12 }}>…</div>
            ) : history.length === 0 ? (
              <div style={{ color: T.textDim, fontSize: 12 }}>{t("detail.history.empty")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map(entry => {
                  const d = new Date(entry.changed_at);
                  const dateStr = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
                    + " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
                  const fieldLabel = entry.field === "lager" ? t("detail.kpi.warehouse") : "FBA";
                  const isIncrease = entry.new_value > entry.old_value;
                  return (
                    <div key={entry.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 8px", fontSize: 12 }}>
                      <span style={{ color: T.textDim, fontSize: 10, fontFamily: "monospace", whiteSpace: "nowrap" }}>{dateStr}</span>
                      <span style={{ color: T.text }}>{fieldLabel}:</span>
                      <span style={{ color: T.textDim }}>{entry.old_value}</span>
                      <span style={{ color: T.textDim }}>→</span>
                      <span style={{ color: isIncrease ? "#4ade80" : "#f87171", fontWeight: 700 }}>{entry.new_value}</span>
                      {entry.reason && <span style={{ color: T.textDim, fontSize: 10, background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4 }}>{entry.reason}</span>}
                    </div>
                  );
                })}
              </div>
            )}
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
  meldebestand_fba: 0, nachschub_menge: 0,
  tags: [], notes: "", lagerort: "", einkaufspreis: 0, image_url: "", image_data: "",
};

function NewProductModal({ existingIds, onClose, onCreated }) {
  const { t } = useT();
  const [form,     setForm]     = useState({ ...EMPTY_PRODUCT });
  const [creating, setCreating] = useState(false);
  const [error,    setError]    = useState(null);
  const [scanning, setScanning] = useState(false);

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
            {/* ASIN — scannable */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{t("modal.field.asin")}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="text" value={form.asin ?? ""} onChange={e => set("asin", e.target.value)} style={{ ...inputStyle, flex: 1 }} disabled={creating} />
                <button onClick={() => setScanning(true)} title={t("scanner.title")} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: T.textDim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
              </div>
            </div>
            {mfield(t("modal.field.warehouse"),"lager",         "number")}
            {mfield(t("modal.field.minStock"), "min_bestand",  "number")}
            {mfield(t("modal.field.price"),    "einkaufspreis","number")}
          </div>
          {scanning && <AsinScanner onScan={r => { set("asin", r.asin ?? r); if (r.name) set("name", r.name); if (r.category) set("kategorie", r.category); setScanning(false); }} onClose={() => setScanning(false)} />}
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
function StatusFilter({ products, active, onChange, searchQuery, onSearch, activeTag, onTagChange }) {
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

  // Collect all unique tags across products
  const allTags = [...new Set(products.flatMap(p => p.tags ?? []))].sort();

  return (
    <div style={{ padding: "12px 24px 4px" }}>
      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textDim, fontSize: 14, pointerEvents: "none" }}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          placeholder={t("search.placeholder")}
          style={{ ...inputStyle, paddingLeft: 36, paddingRight: searchQuery ? 32 : 12 }}
        />
        {searchQuery && (
          <button onClick={() => onSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
        )}
      </div>

      {/* Status filter buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: allTags.length ? 8 : 12 }}>
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

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.textDim, marginRight: 2 }}>{t("filter.tag")}</span>
          {allTags.map(tag => {
            const isActive = activeTag === tag;
            const col = tagColor(tag);
            return (
              <button key={tag} onClick={() => onTagChange(isActive ? null : tag)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, cursor: "pointer", background: isActive ? `${col}22` : "rgba(255,255,255,0.04)", border: `1px solid ${isActive ? col + "55" : "rgba(255,255,255,0.10)"}`, color: isActive ? col : T.textDim, fontSize: 11, fontWeight: isActive ? 600 : 400, fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}>
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stats Modal ─────────────────────────────────────────────────────────────
function StatsModal({ products, deliveries, onClose }) {
  const { t } = useT();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const totalWarehouse = products.reduce((s, p) => s + p.lager, 0);
  const totalFBA       = products.reduce((s, p) => s + p.amazon_fba, 0);
  const totalValue     = products.reduce((s, p) => s + (p.lager + p.amazon_fba) * (p.einkaufspreis ?? 0), 0);
  const criticalCount  = products.filter(p => { const st = getStatus(p); return st === "critical" || st === "out"; }).length;
  const delivThisMonth = deliveries.filter(d => (d.arrival_date ?? d.received_date ?? "") >= monthStart).length;

  const stats = [
    { labelKey: "stats.totalValue",       value: `${totalValue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t("stats.currency")}`, color: T.accent },
    { labelKey: "stats.totalWarehouse",   value: `${totalWarehouse.toLocaleString()} ${t("stats.units")}`,   color: T.text },
    { labelKey: "stats.totalFBA",         value: `${totalFBA.toLocaleString()} ${t("stats.units")}`,         color: "#60a5fa" },
    { labelKey: "stats.deliveriesMonth",  value: delivThisMonth,                                               color: "#fb923c" },
    { labelKey: "stats.critical",         value: criticalCount,                                                color: criticalCount > 0 ? "#f87171" : "#4ade80" },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: "min(460px, 92vw)", ...glass({ padding: "28px" }), border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{t("stats.title")}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: T.textDim, width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {stats.map(({ labelKey, value, color }) => (
            <div key={labelKey} style={{ ...glass({ padding: "16px" }), borderRadius: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
              <div style={{ fontSize: 11, color: T.textDim }}>{t(labelKey)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── ASIN-Scanner (ZXing + SP-API Lookup) ────────────────────────────────────
// phase: "scanning" | "loading" | "error" | "no-credentials"
function AsinScanner({ onScan, onClose }) {
  const { t } = useT();
  const videoRef    = useRef(null);
  const controlsRef = useRef(null);
  const hasCredsRef = useRef(null); // null=checking, false=none, true=configured

  const [phase,        setPhase]        = useState("scanning");
  const [ready,        setReady]        = useState(false);
  const [cameraErr,    setCameraErr]    = useState(null);
  const [scannedValue, setScannedValue] = useState(null);
  const [lookupError,  setLookupError]  = useState(null);

  // Check credentials in background — fast, runs in parallel with camera init
  useEffect(() => {
    loadAmazonCredentials()
      .then(c  => { hasCredsRef.current = !!c; })
      .catch(() => { hasCredsRef.current = false; });
  }, []);

  // Camera — (re)starts whenever phase returns to "scanning"
  useEffect(() => {
    if (phase !== "scanning") return;
    let alive = true;
    setReady(false);
    setCameraErr(null);

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices.length) { setCameraErr(t("scanner.noCamera")); return; }
        const device = devices.find(d => /back|rear|environment/i.test(d.label)) ?? devices[devices.length - 1];
        if (!alive) return;
        setReady(true);
        const reader   = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(device.deviceId, videoRef.current, async (result) => {
          if (!result || !alive) return;
          alive = false;
          controls.stop();
          setReady(false);
          const value = result.getText();
          setScannedValue(value);

          // Wait max 1 s for credential check to finish (usually <50 ms)
          for (let i = 0; hasCredsRef.current === null && i < 10; i++) {
            await new Promise(r => setTimeout(r, 100));
          }

          if (!hasCredsRef.current) {
            setPhase("no-credentials");
            return;
          }

          setPhase("loading");
          try {
            const product = await lookupProduct(value);
            onScan(product); // { asin, name, category } — parent closes scanner
          } catch (e) {
            setLookupError(e.message);
            setPhase("error");
          }
        });
        controlsRef.current = controls;
      } catch (e) {
        if (alive) setCameraErr(e.name === "NotAllowedError" ? t("scanner.permissionDenied") : e.message);
      }
    })();

    return () => { alive = false; controlsRef.current?.stop(); };
  }, [phase, onScan, t]);

  const btnPrimary = { padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: T.accent, color: "#0d2b22", fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif" };
  const btnGhost   = { padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", color: T.textDim, fontSize: 12, fontFamily: "Inter, sans-serif" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", zIndex: 501, transform: "translate(-50%,-50%)", width: "min(380px,calc(100vw - 24px))", ...glass({ padding: 0 }), background: "rgba(6,18,16,0.99)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, flex: 1 }}>{t("scanner.title")}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: T.textDim, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Camera error */}
        {cameraErr && (
          <div style={{ padding: 24, color: "#f87171", fontSize: 13, textAlign: "center" }}>{cameraErr}</div>
        )}

        {/* Camera viewfinder — always rendered so ref is available; hidden in other phases */}
        <div style={{ display: phase === "scanning" && !cameraErr ? "block" : "none", position: "relative", background: "#000", lineHeight: 0 }}>
          <video ref={videoRef} style={{ width: "100%", display: "block", maxHeight: 280 }} playsInline muted />
          {ready && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: 220, height: 70, border: `2px solid ${T.accent}`, borderRadius: 8, boxShadow: `0 0 0 1000px rgba(0,0,0,0.45)` }} />
            </div>
          )}
        </div>

        {/* Loading phase */}
        {phase === "loading" && (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 30, animation: "spin 1s linear infinite", display: "inline-block", marginBottom: 14, color: T.accent }}>⟳</div>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 6 }}>{t("scanner.loading")}</div>
            <div style={{ fontSize: 11, color: T.textDim, fontFamily: "monospace" }}>{scannedValue}</div>
          </div>
        )}

        {/* Error phase */}
        {phase === "error" && (
          <div style={{ padding: "24px 20px" }}>
            <div style={{ color: "#f87171", fontSize: 13, textAlign: "center", marginBottom: 6 }}>{t("scanner.notFound")}</div>
            {lookupError && <div style={{ color: T.textDim, fontSize: 11, textAlign: "center", marginBottom: 12 }}>{lookupError}</div>}
            <div style={{ fontSize: 12, color: T.textDim, textAlign: "center", fontFamily: "monospace", marginBottom: 18 }}>{scannedValue}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button style={btnPrimary} onClick={() => onScan({ asin: scannedValue })}>{t("scanner.useAnyway")}</button>
              <button style={btnGhost}   onClick={() => { setLookupError(null); setScannedValue(null); setPhase("scanning"); }}>{t("scanner.retry")}</button>
            </div>
          </div>
        )}

        {/* No-credentials phase */}
        {phase === "no-credentials" && (
          <div style={{ padding: "24px 20px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text, textAlign: "center", fontFamily: "monospace", marginBottom: 12, wordBreak: "break-all" }}>{scannedValue}</div>
            <div style={{ fontSize: 12, color: "#facc15", textAlign: "center", marginBottom: 20, lineHeight: 1.6 }}>{t("scanner.noCredentials")}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button style={btnPrimary} onClick={() => onScan({ asin: scannedValue })}>OK</button>
              <button style={btnGhost}   onClick={() => { setScannedValue(null); setPhase("scanning"); }}>{t("scanner.retry")}</button>
            </div>
          </div>
        )}

        {/* Hint footer — only in scanning phase */}
        {phase === "scanning" && !cameraErr && (
          <div style={{ padding: "10px 18px 14px", fontSize: 11, color: T.textDim, textAlign: "center" }}>{t("scanner.hint")}</div>
        )}
      </div>
    </>
  );
}

// ─── Nachschub-Alerts ─────────────────────────────────────────────────────────
function ReorderAlerts({ products, dismissed, onDismiss, onDismissAll }) {
  const { t } = useT();
  const alerts = products.filter(p =>
    (p.meldebestand_fba ?? 0) > 0 && (p.amazon_fba ?? 0) < (p.meldebestand_fba ?? 0) && !dismissed.has(p.id)
  );
  if (!alerts.length) return null;

  return (
    <div style={{ background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.25)", padding: "10px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          ⚠ {t("alert.reorder.title")}
        </span>
        <button onClick={onDismissAll} style={{ marginLeft: "auto", fontSize: 11, color: "#f87171", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          {t("alert.reorder.dismissAll")}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {alerts.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "7px 12px", fontSize: 13 }}>
            <span style={{ flex: 1, color: T.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
            <span style={{ color: "#f87171", whiteSpace: "nowrap" }}>{t("alert.reorder.fba")} <b>{p.amazon_fba}</b></span>
            {(p.nachschub_menge ?? 0) > 0 && (
              <span style={{ color: "#facc15", whiteSpace: "nowrap" }}>{t("alert.reorder.suggest")} <b>{p.nachschub_menge}</b></span>
            )}
            <button onClick={() => onDismiss(p.id)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Neue-Lieferung-Modal ─────────────────────────────────────────────────────
function NewDeliveryModal({ products, onClose, onSave }) {
  const { t } = useT();
  const [productId,    setProductId]    = useState("");
  const [date,         setDate]         = useState("");
  const [plannedDate,  setPlannedDate]  = useState("");
  const [qty,          setQty]          = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!productId)  return setError(t("delivery.modal.err.product"));
    if (!date)       return setError(t("delivery.modal.err.date"));
    if (qty <= 0)    return setError(t("delivery.modal.err.qty"));
    setSaving(true);
    setError(null);
    try {
      const parsedPrice = pricePerUnit !== "" ? parseFloat(String(pricePerUnit).replace(",", ".")) : null;
      await onSave(productId, date, qty, plannedDate || null, parsedPrice && parsedPrice > 0 ? parsedPrice : null);
      onClose();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 32,
    cursor: "pointer",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", zIndex: 201,
        transform: "translate(-50%, -50%)",
        width: "min(480px, calc(100vw - 32px))",
        ...glass({ padding: 0 }),
        background: "rgba(13,28,22,0.98)",
        animation: "fadeUp 0.2s ease",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, flex: 1 }}>{t("delivery.modal.title")}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: T.textDim, width: 30, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {error && (
            <div style={{ ...glass({ padding: "9px 13px" }), marginBottom: 16, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{t("delivery.modal.product")}</div>
            <select
              value={productId}
              onChange={e => { setProductId(e.target.value); setError(null); }}
              style={selectStyle}
              disabled={saving}
            >
              <option value="" disabled style={{ background: "#0d2b22" }}>{t("delivery.modal.select")}</option>
              {[...products].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                <option key={p.id} value={p.id} style={{ background: "#0d2b22" }}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{t("delivery.modal.date")} *</div>
              <input
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setError(null); }}
                style={{ ...inputStyle, colorScheme: "dark" }}
                disabled={saving}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{t("delivery.modal.qty")} *</div>
              <input
                type="number"
                min={1}
                value={qty || ""}
                onChange={e => { setQty(Number(e.target.value)); setError(null); }}
                style={inputStyle}
                disabled={saving}
                placeholder="0"
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{t("delivery.modal.plannedDate")}</div>
            <input
              type="date"
              value={plannedDate}
              onChange={e => setPlannedDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
              disabled={saving}
            />
          </div>

          {/* Einkaufspreis pro Stück */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{t("delivery.modal.price")}</div>
            <input
              type="number"
              min={0}
              step={0.01}
              value={pricePerUnit}
              onChange={e => setPricePerUnit(e.target.value)}
              style={inputStyle}
              disabled={saving}
              placeholder="0.00"
            />
            {(() => {
              const currentProduct = products.find(p => p.id === productId);
              const currentPrice = currentProduct?.einkaufspreis ?? 0;
              const hint = t("delivery.modal.priceHint") + (currentPrice > 0 ? ` (€ ${currentPrice.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : "");
              return <div style={{ fontSize: 11, color: T.textDim, marginTop: 5 }}>{hint}</div>;
            })()}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: T.textDim, cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
            {t("delivery.modal.cancel")}
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer", background: T.accent, color: "#0d2b22", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", opacity: saving ? 0.7 : 1, transition: "opacity 0.15s" }}>
            {saving ? t("delivery.modal.saving") : t("delivery.modal.save")}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Wareneingang buchen Modal ────────────────────────────────────────────────
function BookReceiptModal({ product, deliveries, onClose, onBook }) {
  const { t, lang } = useT();
  const existingRec = deliveries.find(d => d.product_id === product.id && d.arrival_date === product.ankunft);
  const [receivedQty, setReceivedQty] = useState(existingRec?.received_quantity || product.ankunft_menge || 0);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const previousReceived = existingRec?.received_quantity ?? 0;
  const delta = receivedQty - previousReceived;
  const newLager = product.lager + delta;

  const handleSave = async () => {
    if (receivedQty < 0) return setError("Menge darf nicht negativ sein.");
    setSaving(true); setError(null);
    try {
      await onBook(product, receivedQty, existingRec?.einkaufspreis_pro_stueck ?? null);
      onClose();
    } catch (e) { setError(e.message); setSaving(false); }
  };

  const wreStatus = getWreStatus(deliveries, product.id, product.ankunft, product.ankunft_menge);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", zIndex: 301, transform: "translate(-50%,-50%)", width: "min(460px,calc(100vw - 24px))", ...glass({ padding: 0 }), background: "rgba(13,28,22,0.98)", overflow: "hidden", animation: "fadeUp 0.2s ease" }}>
        {/* Header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{t("wre.book.title")}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
          </div>
          <WreStatusBadge status={wreStatus} />
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: T.textDim, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px" }}>
          {error && <div style={{ ...glass({ padding: "8px 12px" }), marginBottom: 14, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13 }}>{error}</div>}

          {/* Info row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[
              { label: t("wre.book.ordered"), value: `${product.ankunft_menge}`, color: T.text },
              { label: new Date(product.ankunft).toLocaleDateString(DATE_LOCALE[lang], { day: "2-digit", month: "short", year: "2-digit" }), value: product.ankunft, isDate: true, color: T.textDim },
              { label: t("wre.book.previous"), value: previousReceived > 0 ? `${previousReceived}` : "—", color: previousReceived > 0 ? "#facc15" : T.textDim },
            ].map(({ label, value, isDate, color }) => (
              <div key={label} style={{ ...glass({ padding: "10px 12px", textAlign: "center" }) }}>
                <div style={{ fontSize: isDate ? 11 : 18, fontWeight: 700, color, lineHeight: 1 }}>{isDate ? new Date(value).toLocaleDateString(DATE_LOCALE[lang], { day: "2-digit", month: "short" }) : value}</div>
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Delivery price notice */}
          {existingRec?.einkaufspreis_pro_stueck > 0 && (
            <div style={{ ...glass({ padding: "8px 12px" }), marginBottom: 14, borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.textDim }}>{t("delivery.modal.price")}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>€ {Number(existingRec.einkaufspreis_pro_stueck).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          {/* Received qty input */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, letterSpacing: "0.04em" }}>{t("wre.book.received")}</div>
            <input
              type="number" min={0}
              value={receivedQty}
              onChange={e => { setReceivedQty(Number(e.target.value)); setError(null); }}
              style={{ ...inputStyle, fontSize: 20, fontWeight: 700, textAlign: "center", padding: "10px 16px" }}
              autoFocus
            />
          </div>

          {/* Delta preview */}
          <div style={{ ...glass({ padding: "10px 14px" }), display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: delta === 0 ? T.glassBorder : delta > 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)", background: delta === 0 ? T.glass : delta > 0 ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)" }}>
            <span style={{ fontSize: 12, color: T.textDim }}>{t("wre.book.stockChange")}: {product.lager} → <b style={{ color: T.text }}>{newLager}</b></span>
            <span style={{ fontSize: 14, fontWeight: 700, color: delta > 0 ? "#4ade80" : delta < 0 ? "#f87171" : T.textDim }}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 22px 18px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: T.textDim, cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>{t("wre.book.cancel")}</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer", background: T.accent, color: "#0d2b22", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", opacity: saving ? 0.7 : 1, transition: "opacity 0.15s" }}>
            {saving ? t("wre.book.saving") : t("wre.book.save")}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── FBA Transfer Modal ───────────────────────────────────────────────────────
function FbaTransferModal({ product, onClose, onTransfer }) {
  const { t } = useT();
  const [qty,             setQty]             = useState(0);
  const [tracking,        setTracking]        = useState("");
  const [expectedArrival, setExpectedArrival] = useState("");
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState(null);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const newLager = product.lager - qty;
  const valid    = qty > 0 && qty <= product.lager;

  const handleConfirm = async () => {
    if (qty <= 0)            return setError(t("fba.modal.err.zero"));
    if (qty > product.lager) return setError(t("fba.modal.err.overstock"));
    setSaving(true); setError(null);
    try {
      await onTransfer(product, qty, tracking.trim() || null, expectedArrival || null);
      onClose();
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", zIndex: 401, transform: "translate(-50%,-50%)", width: "min(460px,calc(100vw - 24px))", ...glass({ padding: 0 }), background: "rgba(13,28,22,0.98)", overflow: "hidden", animation: "fadeUp 0.2s ease" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{t("fba.modal.title")}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{product.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: T.textDim, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ padding: "18px 22px" }}>
          {error && <div style={{ ...glass({ padding: "8px 12px" }), marginBottom: 14, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13 }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            <div style={{ ...glass({ padding: "10px 12px", textAlign: "center" }) }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text, lineHeight: 1 }}>{product.lager}</div>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>{t("fba.modal.currentLager")}</div>
            </div>
            <div style={{ ...glass({ padding: "10px 12px", textAlign: "center" }) }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text, lineHeight: 1 }}>{product.amazon_fba}</div>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>{t("fba.modal.currentFba")}</div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, letterSpacing: "0.04em" }}>{t("fba.modal.qty")}</div>
            <input type="number" min={1} max={product.lager} value={qty || ""}
              onChange={e => { setQty(Number(e.target.value)); setError(null); }}
              style={{ ...inputStyle, fontSize: 20, fontWeight: 700, textAlign: "center", padding: "10px 16px" }}
              autoFocus />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, letterSpacing: "0.04em" }}>{t("fba.modal.tracking")}</div>
            <input type="text" value={tracking} onChange={e => setTracking(e.target.value)}
              style={inputStyle} placeholder="z.B. FBA15XK3..." />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, letterSpacing: "0.04em" }}>{t("fba.modal.expectedArrival")}</div>
            <input type="date" value={expectedArrival} onChange={e => setExpectedArrival(e.target.value)}
              style={inputStyle} />
          </div>

          {valid && (
            <div style={{ ...glass({ padding: "10px 14px" }), borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textDim, marginBottom: 5 }}>
                <span>{t("fba.modal.currentLager")}</span>
                <span style={{ color: T.text }}>{product.lager} → <b style={{ color: "#f87171" }}>{newLager}</b></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textDim }}>
                <span>{t("fba.modal.currentFba")}</span>
                <span style={{ color: "#facc15", fontWeight: 600 }}>{product.amazon_fba} → {t("fba.shipments.status.pending")}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "0 22px 18px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: T.textDim, cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>{t("fba.modal.cancel")}</button>
          <button onClick={handleConfirm} disabled={saving || !valid} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: (saving || !valid) ? "default" : "pointer", background: T.accent, color: "#0d2b22", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", opacity: (saving || !valid) ? 0.45 : 1, transition: "opacity 0.15s" }}>
            {saving ? t("fba.modal.saving") : t("fba.modal.confirm")}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Stock Correction Modal ───────────────────────────────────────────────────
function StockCorrectionModal({ product, onClose, onCorrect }) {
  const { t } = useT();
  const [newLager, setNewLager] = useState(product.lager);
  const [newFba,   setNewFba]   = useState(product.amazon_fba);
  const [reason,   setReason]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const lagerDelta = newLager - product.lager;
  const fbaDelta   = newFba   - product.amazon_fba;
  const hasChanges = lagerDelta !== 0 || fbaDelta !== 0;

  const handleConfirm = async () => {
    if (newLager < 0 || newFba < 0) return setError(t("correction.modal.err.negative"));
    if (!hasChanges)                 return setError(t("correction.modal.err.noChange"));
    setSaving(true); setError(null);
    try {
      await onCorrect(product, newLager, newFba, reason.trim() || t("correction.modal.defaultReason"));
      onClose();
    } catch (e) { setError(e.message); setSaving(false); }
  };

  const deltaColor = d => d > 0 ? "#4ade80" : d < 0 ? "#f87171" : T.textDim;
  const deltaText  = d => d !== 0 ? ` (${d > 0 ? "+" : ""}${d})` : "";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", zIndex: 401, transform: "translate(-50%,-50%)", width: "min(460px,calc(100vw - 24px))", ...glass({ padding: 0 }), background: "rgba(13,28,22,0.98)", overflow: "hidden", animation: "fadeUp 0.2s ease" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{t("correction.modal.title")}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{product.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: T.textDim, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ padding: "18px 22px" }}>
          {error && <div style={{ ...glass({ padding: "8px 12px" }), marginBottom: 14, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13 }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, letterSpacing: "0.04em" }}>{t("correction.modal.newLager")}</div>
              <input type="number" min={0} value={newLager}
                onChange={e => { setNewLager(Number(e.target.value)); setError(null); }}
                style={inputStyle} autoFocus />
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ color: T.textDim }}>{t("correction.modal.was")} {product.lager}</span>
                {lagerDelta !== 0 && <span style={{ fontWeight: 700, color: deltaColor(lagerDelta) }}>{deltaText(lagerDelta)}</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, letterSpacing: "0.04em" }}>{t("correction.modal.newFba")}</div>
              <input type="number" min={0} value={newFba}
                onChange={e => { setNewFba(Number(e.target.value)); setError(null); }}
                style={inputStyle} />
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ color: T.textDim }}>{t("correction.modal.was")} {product.amazon_fba}</span>
                {fbaDelta !== 0 && <span style={{ fontWeight: 700, color: deltaColor(fbaDelta) }}>{deltaText(fbaDelta)}</span>}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, letterSpacing: "0.04em" }}>{t("correction.modal.reason")}</div>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              style={inputStyle} placeholder={t("correction.modal.reasonHint")} />
          </div>
        </div>

        <div style={{ padding: "0 22px 18px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: T.textDim, cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>{t("correction.modal.cancel")}</button>
          <button onClick={handleConfirm} disabled={saving || !hasChanges || newLager < 0 || newFba < 0} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: (saving || !hasChanges) ? "default" : "pointer", background: "#f59e0b", color: "#000", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", opacity: (saving || !hasChanges || newLager < 0 || newFba < 0) ? 0.45 : 1, transition: "opacity 0.15s" }}>
            {saving ? t("correction.modal.saving") : t("correction.modal.confirm")}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Lieferungen Tab ──────────────────────────────────────────────────────────
function LieferungenView({ products, deliveries, onSelect, onAddDelivery, onBook }) {
  const { t, lang } = useT();
  const incoming = products.filter(p => p.ankunft).sort((a, b) => new Date(a.ankunft) - new Date(b.ankunft));

  const addButton = (
    <button
      onClick={onAddDelivery}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: `1px solid ${T.accent}55`, background: T.accentDim, color: T.accent, fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}
    >
      {t("delivery.addButton")}
    </button>
  );

  if (incoming.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 20 }}>
        <button
          onClick={onAddDelivery}
          style={{ width: 72, height: 72, borderRadius: "50%", border: `2px dashed ${T.accent}55`, background: T.accentDim, color: T.accent, fontSize: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", lineHeight: 1 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = "rgba(74,222,128,0.25)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `${T.accent}55`; e.currentTarget.style.background = T.accentDim; }}
        >
          +
        </button>
        <div style={{ color: T.textDim, fontSize: 14 }}>{t("delivery.empty.cta")}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>{addButton}</div>
      {incoming.map(p => {
        const rec        = deliveries.find(d => d.product_id === p.id && d.arrival_date === p.ankunft);
        const wreStatus  = getWreStatus(deliveries, p.id, p.ankunft, p.ankunft_menge);
        const total      = p.lager + p.amazon_fba;
        const isBooked   = wreStatus === "complete" || wreStatus === "discrepancy";
        const received   = rec?.received_quantity ?? 0;
        const ordered    = p.ankunft_menge;
        const showReceived = received > 0;

        const fmtDate = (dateStr) => dateStr
          ? new Date(dateStr).toLocaleDateString(DATE_LOCALE[lang], { day: "2-digit", month: "long" })
          : null;
        const orderDateStr   = fmtDate(p.ankunft);
        const plannedDateStr = fmtDate(rec?.planned_arrival_date);
        const arrivedDateStr = fmtDate(rec?.received_date);

        return (
          <div key={p.id}
            style={{ ...glass({ padding: "14px 18px" }), display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s" }}
          >
            {/* Clickable area → opens detail */}
            <div onClick={() => onSelect(p)} style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.parentElement.style.background = T.glassHover}
              onMouseLeave={e => e.currentTarget.parentElement.style.background = T.glass}
            >
              <div style={{ fontSize: 26, width: 36, textAlign: "center", flexShrink: 0 }}>📦</div>

              {/* Name + SKU */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.textDim, fontFamily: "monospace", marginTop: 1 }}>{p.id}</div>
              </div>

              {/* Qty column — received (main) or expected */}
              <div style={{ textAlign: "center", minWidth: 64, flexShrink: 0 }}>
                {showReceived ? (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: received === ordered ? "#4ade80" : "#fb923c" }}>{received}</div>
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{t("deliveries.received")}</div>
                    <div style={{ fontSize: 10, color: T.textDim }}>{t("deliveries.orderedOf", { qty: ordered })}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: "#60a5fa" }}>+{ordered}</div>
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{t("deliveries.expected")}</div>
                  </>
                )}
              </div>

              {/* Date column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 130, flexShrink: 0 }}>
                {orderDateStr && (
                  <div style={{ fontSize: 11, color: T.textDim }}>
                    {t("deliveries.orderDate")} <span style={{ color: T.text, fontWeight: 600 }}>{orderDateStr}</span>
                  </div>
                )}
                {plannedDateStr && (
                  <div style={{ fontSize: 11, color: T.textDim }}>
                    {t("deliveries.plannedDate")} <span style={{ color: "#60a5fa", fontWeight: 600 }}>{plannedDateStr}</span>
                  </div>
                )}
                {arrivedDateStr && (
                  <div style={{ fontSize: 11, color: T.textDim }}>
                    {t("deliveries.arrivedDate")} <span style={{ color: "#4ade80", fontWeight: 600 }}>{arrivedDateStr}</span>
                  </div>
                )}
              </div>

              {/* Current stock */}
              <div style={{ textAlign: "center", minWidth: 48, flexShrink: 0 }}>
                <div style={{ fontSize: 13, color: T.text }}>{total}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{t("deliveries.col.current")}</div>
              </div>
            </div>

            {/* Status + book button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <WreStatusBadge status={wreStatus} />
              <button
                onClick={e => { e.stopPropagation(); onBook(p); }}
                style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${isBooked ? "rgba(255,255,255,0.12)" : T.accent + "55"}`, background: isBooked ? "rgba(255,255,255,0.05)" : T.accentDim, color: isBooked ? T.textDim : T.accent, fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
              >
                {isBooked ? t("wre.book.correct") : t("wre.book.button")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Amazon Sync Button ───────────────────────────────────────────────────────
function SyncAmazonButton({ creds, syncState, onSync, isMobile }) {
  const { t } = useT();
  const configured = !!creds;
  const running    = syncState.status === "running";
  const success    = syncState.status === "success";
  const hasError   = syncState.status === "error";

  const color = hasError ? "#f87171" : success ? T.accent : T.accent;
  const bg    = hasError ? "rgba(248,113,113,0.15)" : T.accentDim;
  const label = running ? t("sync.running")
    : success ? t("sync.success", { updated: syncState.message?.updated ?? 0, total: syncState.message?.total ?? 0 })
    : hasError ? t("sync.error")
    : configured ? t("sync.button")
    : t("sync.notConfigured");

  return (
    <button
      disabled={!configured || running}
      onClick={onSync}
      title={!configured ? t("sync.notConfigured") : undefined}
      style={{
        padding: isMobile ? "7px 10px" : "7px 14px",
        borderRadius: 9,
        border: `1px solid ${configured ? color + "55" : "rgba(255,255,255,0.12)"}`,
        background: configured ? bg : "rgba(255,255,255,0.04)",
        color: configured ? color : T.textDim,
        fontSize: isMobile ? 11 : 12,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        cursor: configured && !running ? "pointer" : "default",
        opacity: running ? 0.7 : 1,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span style={{ fontSize: 13 }}>⟳</span>
      {!isMobile && <span>{label}</span>}
    </button>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
function SettingsPage({ creds, settingsLoading, onSave, syncState }) {
  const { t } = useT();
  const EMPTY = {
    amazon_client_id: "", amazon_client_secret: "", amazon_refresh_token: "",
    amazon_marketplace_id: "", amazon_region: "",
    amazon_aws_access_key: "", amazon_aws_secret_key: "",
  };
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  // Pre-fill with existing creds once loaded
  useEffect(() => {
    if (creds) setForm(f => ({ ...f, ...creds }));
  }, [creds]);

  const set = (key, value) => { setForm(f => ({ ...f, [key]: value })); setSaved(false); };

  const handleSave = async () => {
    setSaving(true); setSaveErr(null); setSaved(false);
    try {
      await onSave(form);
      setSaved(true);
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const sfield = (labelKey, key, type = "text") => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>{t(labelKey)}</div>
      <input
        type={type}
        value={form[key] ?? ""}
        onChange={e => set(key, e.target.value)}
        style={{ ...inputStyle, fontFamily: key.includes("key") || key.includes("token") || key.includes("secret") ? "monospace" : "Inter, sans-serif" }}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );

  const lastSync = syncState.lastSync;
  const lastSyncStr = lastSync
    ? new Date(lastSync).toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 24 }}>{t("settings.title")}</div>

      {settingsLoading && (
        <div style={{ color: T.textDim, fontSize: 13, marginBottom: 20 }}>…</div>
      )}

      {saveErr && (
        <div style={{ ...glass({ padding: "10px 14px" }), marginBottom: 16, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13 }}>
          {t("settings.saveError")} {saveErr}
        </div>
      )}

      {/* LWA Section */}
      <div style={{ ...glass({ padding: "20px 22px" }), marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
          {t("settings.section.lwa")}
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 16, lineHeight: 1.6 }}>{t("settings.hint.lwa")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          {sfield("settings.field.clientId",     "amazon_client_id")}
          {sfield("settings.field.clientSecret", "amazon_client_secret")}
        </div>
        {sfield("settings.field.refreshToken", "amazon_refresh_token")}
      </div>

      {/* Marketplace Section */}
      <div style={{ ...glass({ padding: "20px 22px" }), marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
          {t("settings.section.marketplace")}
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 16, lineHeight: 1.6 }}>{t("settings.hint.marketplace")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          {sfield("settings.field.marketplaceId", "amazon_marketplace_id")}
          {sfield("settings.field.region",        "amazon_region")}
        </div>
      </div>

      {/* AWS SigV4 Section */}
      <div style={{ ...glass({ padding: "20px 22px" }), marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textDim, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
          {t("settings.section.aws")}
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 16, lineHeight: 1.6 }}>{t("settings.hint.aws")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          {sfield("settings.field.awsAccessKey", "amazon_aws_access_key")}
          {sfield("settings.field.awsSecretKey", "amazon_aws_secret_key")}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "9px 22px", borderRadius: 9, border: "none", cursor: saving ? "default" : "pointer", background: saved ? "rgba(74,222,128,0.2)" : T.accent, color: saved ? T.accent : "#0d2b22", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif", transition: "all 0.2s", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? t("settings.saving") : saved ? t("settings.saved") : t("settings.save")}
        </button>
        {lastSyncStr && (
          <span style={{ fontSize: 12, color: T.textDim }}>
            {t("sync.lastSync")} <span style={{ color: T.text }}>{lastSyncStr}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Haupt-App ────────────────────────────────────────────────────────────────
export default function App() {
  const [splashDone,      setSplashDone]      = useState(false);
  const [activeFilter,    setActiveFilter]    = useState("all");
  const [activeTab,       setActiveTab]       = useState("bestaende");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showNewModal,         setShowNewModal]         = useState(false);
  const [showDeliveryModal,    setShowDeliveryModal]    = useState(false);
  const [bookingProduct,       setBookingProduct]       = useState(null);
  const [fbaTransferProduct,   setFbaTransferProduct]   = useState(null);
  const [correctionProduct,    setCorrectionProduct]    = useState(null);
  const [fbaTransfers,         setFbaTransfers]         = useState({});
  const [dismissedAlerts,      setDismissedAlerts]      = useState(() => new Set());
  const [lang, setLangState] = useState(() => localStorage.getItem("lang") ?? "de");
  const setLang = (l) => { setLangState(l); localStorage.setItem("lang", l); };
  const [searchQuery,     setSearchQuery]     = useState("");
  const [activeTag,       setActiveTag]       = useState(null);
  const [showStats,       setShowStats]       = useState(false);
  const isMobile = useWindowWidth() < 640;
  const t        = useMemo(() => makeTFn(lang), [lang]);

  const { products, loading, error, reload, save, add } = useProducts();
  const { deliveries, reload: reloadDeliveries, book: bookDelivery, plan: planDelivery } = useDeliveries();
  const { creds, settingsLoading, saveCreds, sync, syncState } = useAmazonSettings();

  const handleSync = useCallback(() => sync(reload), [sync, reload]);

  const handleSave = useCallback(async (updated) => {
    const prev = products.find(p => p.id === updated.id);
    const saved = await save(updated);
    // Write stock history for changed stock fields
    const historyEntries = [];
    const reason = t("history.reason.manual");
    if (prev && updated.lager !== prev.lager) {
      historyEntries.push({ product_id: updated.id, field: "lager", old_value: prev.lager, new_value: updated.lager, reason });
    }
    if (prev && updated.amazon_fba !== prev.amazon_fba) {
      historyEntries.push({ product_id: updated.id, field: "amazon_fba", old_value: prev.amazon_fba, new_value: updated.amazon_fba, reason });
    }
    if (historyEntries.length) {
      supabase.from("stock_history").insert(historyEntries).then(
        ({ error }) => { if (error) console.warn("[DB] stock_history.insert (handleSave) FAILED", { code: error.code, msg: error.message }); }
      ).catch(e => console.warn("[DB] stock_history.insert (handleSave) exception", e.message));
    }
    setSelectedProduct(saved);
    return saved;
  }, [save, products, t]);

  const handleAdd = useCallback(async (product) => {
    const created = await add(product);
    return created;
  }, [add]);

  const handleAddDelivery = useCallback(async (productId, date, qty, plannedDate, preisProStueck) => {
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error("Product not found");
    await save({ ...product, ankunft: date, ankunft_menge: qty });
    await planDelivery(productId, date, qty, plannedDate, preisProStueck);
  }, [products, save, planDelivery]);

  // Wareneingang buchen: update deliveries table + adjust lager by delta
  const handleBook = useCallback(async (product, receivedQty, deliveryPrice) => {
    const { previousReceived } = await bookDelivery(
      product.id, product.ankunft, product.ankunft_menge, receivedQty
    );
    const delta = receivedQty - previousReceived;
    const updatedProduct = {
      ...product,
      ...(delta !== 0 ? { lager: product.lager + delta } : {}),
      ...(deliveryPrice > 0 ? { einkaufspreis: deliveryPrice } : {}),
    };
    if (delta !== 0 || deliveryPrice > 0) {
      await save(updatedProduct);
      if (delta !== 0) {
        supabase.from("stock_history").insert([{
          product_id: product.id,
          field: "lager",
          old_value: product.lager,
          new_value: updatedProduct.lager,
          reason: t("history.reason.receipt"),
        }]).then(
          ({ error }) => { if (error) console.warn("[DB] stock_history.insert (handleBook) FAILED", { code: error.code, msg: error.message }); }
        ).catch(e => console.warn("[DB] stock_history.insert (handleBook) exception", e.message));
      }
    }
    await reloadDeliveries();
  }, [bookDelivery, save, reloadDeliveries, t]);

  // FBA Nachschub: deduct lager only, save to fba_shipments (FBA stays pending)
  const handleFbaTransfer = useCallback(async (product, qty, tracking, expectedArrival) => {
    const newLager = product.lager - qty;
    const saved = await save({ ...product, lager: newLager });
    supabase.from("fba_shipments").insert([{
      product_id:        product.id,
      sent_quantity:     qty,
      tracking_reference: tracking ?? null,
      expected_arrival:  expectedArrival ?? null,
      status:            "pending",
    }]).then(({ error }) => {
      if (error) console.warn("[DB] fba_shipments.insert FAILED", { code: error.code, msg: error.message });
    }).catch(e => console.warn("[DB] fba_shipments.insert exception", e.message));
    supabase.from("stock_history").insert([{
      product_id: product.id, field: "lager", old_value: product.lager, new_value: newLager, reason: t("history.reason.fba"),
    }]).then(({ error }) => {
      if (error) console.warn("[DB] stock_history.insert (handleFbaTransfer) FAILED", { code: error.code, msg: error.message });
    }).catch(e => console.warn("[DB] stock_history.insert (handleFbaTransfer) exception", e.message));
    setSelectedProduct(saved);
    setFbaTransfers(prev => ({ ...prev, [product.id]: qty }));
  }, [save, t]);

  // FBA Ankunft: confirm shipment received, add to amazon_fba
  const handleFbaArrival = useCallback(async (product, shipmentId, confirmedQty, sentQty) => {
    const status = confirmedQty >= sentQty ? "arrived" : "discrepancy";
    const { error: shipErr } = await supabase.from("fba_shipments")
      .update({ confirmed_quantity: confirmedQty, status })
      .eq("id", shipmentId);
    if (shipErr) console.error("[DB] fba_shipments.update FAILED", { code: shipErr.code, msg: shipErr.message });
    const newFba = product.amazon_fba + confirmedQty;
    const saved  = await save({ ...product, amazon_fba: newFba });
    supabase.from("stock_history").insert([{
      product_id: product.id, field: "amazon_fba", old_value: product.amazon_fba, new_value: newFba, reason: t("history.reason.fba_arrival"),
    }]).then(({ error }) => {
      if (error) console.warn("[DB] stock_history.insert (handleFbaArrival) FAILED", { code: error.code, msg: error.message });
    }).catch(e => console.warn("[DB] stock_history.insert (handleFbaArrival) exception", e.message));
    setSelectedProduct(saved);
  }, [save, t]);

  // Bestandskorrektur: overwrite lager and amazon_fba with actual counts
  const handleStockCorrection = useCallback(async (product, newLager, newFba, reason) => {
    const saved = await save({ ...product, lager: newLager, amazon_fba: newFba });
    const entries = [];
    if (newLager !== product.lager)      entries.push({ product_id: product.id, field: "lager",      old_value: product.lager,      new_value: newLager, reason });
    if (newFba   !== product.amazon_fba) entries.push({ product_id: product.id, field: "amazon_fba", old_value: product.amazon_fba, new_value: newFba,   reason });
    if (entries.length) {
      supabase.from("stock_history").insert(entries).then(({ error }) => {
        if (error) console.warn("[DB] stock_history.insert (handleStockCorrection) FAILED", { code: error.code, msg: error.message });
      }).catch(e => console.warn("[DB] stock_history.insert (handleStockCorrection) exception", e.message));
    }
    setSelectedProduct(saved);
  }, [save]);

  const handleModalClose = (createdProduct) => {
    setShowNewModal(false);
    if (createdProduct?.id) setSelectedProduct(createdProduct);
  };

  const existingIds = useMemo(() => new Set(products.map(p => p.id)), [products]);

  const filtered = products.filter(p => {
    if (activeFilter !== "all") {
      if (activeFilter === "incoming" && !p.ankunft) return false;
      if (activeFilter !== "incoming" && getStatus(p) !== activeFilter) return false;
    }
    if (activeTag && !(p.tags ?? []).includes(activeTag)) return false;
    if (searchQuery && !getSearchMatch(p, searchQuery)) return false;
    return true;
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
                { key: "bestaende",     labelKey: "header.nav.stock" },
                { key: "lieferungen",   labelKey: "header.nav.deliveries" },
                { key: "einstellungen", labelKey: null },
              ].map(({ key, labelKey }) => (
                <button key={key} onClick={() => setActiveTab(key)} title={key === "einstellungen" ? t("header.nav.settings") : undefined} style={{ padding: isMobile ? "7px 10px" : "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: activeTab === key ? T.accentDim : "transparent", color: activeTab === key ? T.accent : T.textDim, fontSize: isMobile ? 12 : 13, fontWeight: 500, fontFamily: "Inter, sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {key === "einstellungen" ? (
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" fill="currentColor"/>
                    </svg>
                  ) : t(labelKey)}
                </button>
              ))}
            </div>
            {!isMobile && <LangToggle />}
            <button onClick={() => setShowStats(true)} title={t("stats.title")} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: T.textDim, fontSize: 16, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>📊</button>
            <SyncAmazonButton creds={creds} syncState={syncState} onSync={handleSync} isMobile={isMobile} />
            <button onClick={() => setShowNewModal(true)} style={{ padding: isMobile ? "7px 12px" : "8px 16px", borderRadius: 9, border: `1px solid ${T.accent}55`, background: T.accentDim, color: T.accent, fontSize: isMobile ? 12 : 13, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
              {isMobile ? "+" : t("header.addItem")}
            </button>
          </div>
        </header>

        {/* ── Nachschub-Alerts ── */}
        {!loading && (
          <ReorderAlerts
            products={products}
            dismissed={dismissedAlerts}
            onDismiss={id => setDismissedAlerts(s => new Set([...s, id]))}
            onDismissAll={() => setDismissedAlerts(new Set(products.map(p => p.id)))}
          />
        )}

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
        {!loading && !error && activeTab === "bestaende" && (
          <>
            <StatusFilter
              products={products}
              active={activeFilter}
              onChange={setActiveFilter}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              activeTag={activeTag}
              onTagChange={setActiveTag}
            />
            <div style={{ padding: "0 24px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
              {filtered.length === 0 ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", color: T.textDim, padding: "60px 0" }}>{t("filter.empty")}</div>
              ) : (
                filtered.map(p => <ProductCard key={p.id} product={p} onClick={setSelectedProduct} searchMatch={getSearchMatch(p, searchQuery)} delivery={deliveries.find(d => d.product_id === p.id && d.arrival_date === p.ankunft)} fbaTransfer={fbaTransfers[p.id] ?? 0} />)
              )}
            </div>
          </>
        )}
        {!loading && !error && activeTab === "lieferungen" && (
          <LieferungenView
            products={products}
            deliveries={deliveries}
            onSelect={p => { setSelectedProduct(p); setActiveTab("bestaende"); }}
            onAddDelivery={() => setShowDeliveryModal(true)}
            onBook={p => setBookingProduct(p)}
          />
        )}
        {activeTab === "einstellungen" && (
          <SettingsPage
            creds={creds}
            settingsLoading={settingsLoading}
            onSave={saveCreds}
            syncState={syncState}
          />
        )}

        {/* ── Stats Modal ── */}
        {showStats && (
          <StatsModal products={products} deliveries={deliveries} onClose={() => setShowStats(false)} />
        )}

        {/* ── Detail-Panel ── */}
        {selectedProduct && (
          <DetailPanel
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onSave={handleSave}
            onFbaTransfer={() => setFbaTransferProduct(selectedProduct)}
            onStockCorrection={() => setCorrectionProduct(selectedProduct)}
            onFbaArrival={handleFbaArrival}
          />
        )}

        {/* ── Neuer-Artikel-Modal ── */}
        {showNewModal && (
          <NewProductModal existingIds={existingIds} onClose={handleModalClose} onCreated={handleAdd} />
        )}

        {/* ── Neue-Lieferung-Modal ── */}
        {showDeliveryModal && (
          <NewDeliveryModal products={products} onClose={() => setShowDeliveryModal(false)} onSave={handleAddDelivery} />
        )}

        {/* ── Wareneingang-Modal ── */}
        {bookingProduct && (
          <BookReceiptModal
            product={bookingProduct}
            deliveries={deliveries}
            onClose={() => setBookingProduct(null)}
            onBook={handleBook}
          />
        )}

        {/* ── FBA Nachschub-Modal ── */}
        {fbaTransferProduct && (
          <FbaTransferModal
            product={fbaTransferProduct}
            onClose={() => setFbaTransferProduct(null)}
            onTransfer={handleFbaTransfer}
          />
        )}

        {/* ── Bestandskorrektur-Modal ── */}
        {correctionProduct && (
          <StockCorrectionModal
            product={correctionProduct}
            onClose={() => setCorrectionProduct(null)}
            onCorrect={handleStockCorrection}
          />
        )}
      </div>
    </LangContext.Provider>
  );
}
