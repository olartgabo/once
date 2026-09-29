import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { api } from "./api";
import type { Invoice, InvoiceInputs, Scenario, TraceEvent } from "./types";
import "./northstar.css";

const aliases: Record<string, string> = {
  Customers: "Clients",
  Billing: "Invoices",
  "New invoice": "Draft invoice",
  "Create invoice": "Issue invoice",
  "Export PDF": "Download PDF",
  "Payment terms": "Due terms",
  "Search customers": "Find clients",
  "Add line item": "Add another item",
};
const blankItem = () => ({ description: "", quantity: 1, unitPrice: 0 });

export default function Northstar() {
  const scenarioId =
    new URLSearchParams(window.location.search).get("scenario") || "";
  const [scenario, setScenario] = useState<Scenario>();
  const [page, setPage] = useState<
    "home" | "customers" | "customer" | "editor" | "invoice"
  >("home");
  const [billing, setBilling] = useState(false);
  const [query, setQuery] = useState("");
  const [inputs, setInputs] = useState<InvoiceInputs>({
    customer: "",
    terms: "NET_30",
    items: [blankItem()],
  });
  const [invoice, setInvoice] = useState<Invoice>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState(false);
  useEffect(() => {
    api<Scenario>(`/scenarios/${encodeURIComponent(scenarioId)}`)
      .then(setScenario)
      .catch((e: Error) => setError(e.message));
  }, [scenarioId]);
  const level = scenario?.level || 0;
  const label = (name: string) =>
    level >= 4
      ? aliases[name] ||
        name
          .replace(/^Description /, "Details ")
          .replace(/^Quantity /, "Units ")
          .replace(/^Unit price /, "Rate ")
      : name;
  const id = (name: string) => {
    if (level < 2) return name;
    let hash = scenario?.seed || 1;
    for (const char of name)
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return `field-${(hash >>> 0).toString(36)}`;
  };
  const record = (
    type: TraceEvent["type"],
    selector: string,
    role: string,
    name: string,
    value?: string,
  ) => {
    const event: TraceEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: Date.now(),
      selector: `#${id(selector)}`,
      role,
      name: label(name),
      ...(value === undefined ? {} : { value }),
    };
    if (window.parent !== window)
      window.parent.postMessage(
        { type: "once:trace", event },
        window.location.origin,
      );
  };
  const click = (selector: string, name: string, action: () => void) => {
    record("click", selector, "button", name);
    action();
  };
  const updateItem = (
    index: number,
    field: "description" | "quantity" | "unitPrice",
    value: string,
  ) => {
    const names = {
      description: "Description",
      quantity: "Quantity",
      unitPrice: "Unit price",
    };
    const selectors = {
      description: "description",
      quantity: "quantity",
      unitPrice: "price",
    };
    record(
      "input",
      `${selectors[field]}-${index}`,
      field === "description" ? "textbox" : "spinbutton",
      `${names[field]} ${index + 1}`,
      value,
    );
    setInputs((current) => ({
      ...current,
      items: current.items.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "description" ? value : Number(value),
            }
          : item,
      ),
    }));
  };
  const createInvoice = async () => {
    // Capture submitted values too, including fields left at their defaults.
    inputs.items.forEach((item, index) => {
      record(
        "input",
        `description-${index}`,
        "textbox",
        `Description ${index + 1}`,
        item.description,
      );
      record(
        "input",
        `quantity-${index}`,
        "spinbutton",
        `Quantity ${index + 1}`,
        String(item.quantity),
      );
      record(
        "input",
        `price-${index}`,
        "spinbutton",
        `Unit price ${index + 1}`,
        String(item.unitPrice),
      );
    });
    record(
      "select",
      "payment-terms",
      "combobox",
      "Payment terms",
      inputs.terms,
    );
    record("click", "save-invoice", "button", "Create invoice");
    setBusy(true);
    setError("");
    try {
      setInvoice(
        await api<Invoice>(
          `/scenarios/${encodeURIComponent(scenarioId)}/invoices`,
          inputs,
        ),
      );
      setPage("invoice");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create invoice.");
    } finally {
      setBusy(false);
    }
  };
  const exportPdf = async () => {
    if (!invoice) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/scenarios/${encodeURIComponent(scenarioId)}/invoices/${encodeURIComponent(invoice.id)}/pdf`,
      );
      if (!response.ok)
        throw new Error("The PDF could not be exported. Please try again.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.id}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExported(true);
      if (window.parent !== window)
        window.parent.postMessage(
          { type: "once:complete", inputs },
          window.location.origin,
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not export PDF.");
    } finally {
      setBusy(false);
    }
  };
  const currency = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const total = inputs.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  return (
    <div
      className={`northstar ns-level-${level} ${level >= 3 ? "ns-reordered" : ""}`}
    >
      <aside className="ns-sidebar">
        <div className="ns-brand">
          <Sparkles size={21} fill="currentColor" /> northstar<span>CRM</span>
        </div>
        <div className="ns-workspace">
          <div className="ns-workspace-icon">N</div>
          <div>
            Northstar workspace<small>Pro plan</small>
          </div>
        </div>
        <div className="ns-nav-label">WORKSPACE</div>
        <nav>
          <button
            id={id("nav-overview")}
            className={page === "home" ? "active" : ""}
            onClick={() =>
              click("nav-overview", "Overview", () => setPage("home"))
            }
          >
            <LayoutDashboard size={16} />
            Overview
          </button>
          <button
            id={id("nav-customers")}
            className={page !== "home" ? "active" : ""}
            onClick={() =>
              click("nav-customers", "Customers", () => {
                setPage("customers");
                setBilling(false);
              })
            }
          >
            <Users size={16} />
            {label("Customers")}
            <span className="ns-nav-count" aria-hidden="true">
              {scenario?.customers.length || 3}
            </span>
          </button>
          <div className="ns-nav-decoration">
            <FileText size={16} />
            Reports
          </div>
        </nav>
        <div className="ns-sidebar-bottom">
          <Settings size={15} /> Workspace settings
          <div className="ns-person">
            <span>JD</span>
            <div>
              Jamie Davis<small>Workspace admin</small>
            </div>
          </div>
        </div>
      </aside>
      <section className="ns-main">
        <header className="ns-topbar">
          <span>
            Workspace <ChevronRight size={12} />{" "}
            {page === "home" ? "Overview" : label("Customers")}
            {inputs.customer && page !== "customers" && page !== "home" && (
              <>
                <ChevronRight size={12} />
                {inputs.customer}
              </>
            )}
          </span>
          <div className="ns-avatar">JD</div>
        </header>
        <main className="ns-content">
          {error && (
            <div className="ns-error" role="alert">
              {error}
            </div>
          )}
          {!scenario ? (
            <p className="ns-muted" role="status">
              {error ? "Unable to load this workspace." : "Loading workspace…"}
            </p>
          ) : (
            <>
              {page === "home" && (
                <>
                  <div className="ns-eyebrow">YOUR WORKSPACE, AT A GLANCE</div>
                  <h1>
                    Good morning, Jamie <span className="ns-wave">✦</span>
                  </h1>
                  <p className="ns-subtitle">
                    A little clarity for your working day.
                  </p>
                  <div className="ns-stats">
                    <article>
                      <span>Total customers</span>
                      <strong>
                        {scenario.customers.length.toString().padStart(2, "0")}
                      </strong>
                      <small>All relationships in one place</small>
                    </article>
                    <article>
                      <span>Invoices created</span>
                      <strong>
                        {scenario.invoices.length.toString().padStart(2, "0")}
                      </strong>
                      <small>Your workspace activity</small>
                    </article>
                    <article>
                      <span>Workspace status</span>
                      <strong className="ns-status-text">
                        All set <Check size={20} />
                      </strong>
                      <small>Ready for your next task</small>
                    </article>
                  </div>
                  <div className="ns-section-heading">
                    <h2>Recent customers</h2>
                    <span>Updated just now</span>
                  </div>
                  <div className="ns-preview-list">
                    {scenario.customers.map((customer, index) => (
                      <div key={customer}>
                        <span className={`ns-customer-icon color-${index}`}>
                          {customer
                            .split(" ")
                            .map((word) => word[0])
                            .join("")}
                        </span>
                        <div>
                          <strong>{customer}</strong>
                          <small>Active customer</small>
                        </div>
                        <span className="ns-tag">Active</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {page === "customers" && (
                <>
                  <div className="ns-heading-row">
                    <div>
                      <h1>{label("Customers")}</h1>
                      <p className="ns-subtitle">
                        The people and companies you work with.
                      </p>
                    </div>
                    <span className="ns-pill">
                      {scenario.customers.length} total
                    </span>
                  </div>
                  <div className="ns-search">
                    <Search size={16} />
                    <input
                      id={id("customer-search")}
                      type="search"
                      aria-label={label("Search customers")}
                      placeholder={label("Search customers")}
                      value={query}
                      onChange={(e) => {
                        record(
                          "input",
                          "customer-search",
                          "searchbox",
                          "Search customers",
                          e.target.value,
                        );
                        setQuery(e.target.value);
                      }}
                    />
                  </div>
                  <div className="ns-customer-table">
                    <div className="ns-table-head">
                      <span>COMPANY</span>
                      <span>STATUS</span>
                      <span>RELATIONSHIP</span>
                    </div>
                    {scenario.customers
                      .filter((customer) =>
                        customer.toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((customer) => {
                        const index = scenario.customers.indexOf(customer);
                        const selector = `customer-${customer.toLowerCase().split(" ")[0]}`;
                        return (
                          <button
                            id={id(selector)}
                            aria-label={customer}
                            className="ns-customer-row"
                            key={customer}
                            onClick={() =>
                              click(selector, customer, () => {
                                setInputs((current) => ({
                                  ...current,
                                  customer,
                                }));
                                setBilling(false);
                                setPage("customer");
                              })
                            }
                          >
                            <span className="ns-company">
                              <span
                                className={`ns-customer-icon color-${index}`}
                              >
                                {customer
                                  .split(" ")
                                  .map((word) => word[0])
                                  .join("")}
                              </span>
                              <strong>
                                {customer}
                                <small>
                                  {customer.toLowerCase().replace(/ /g, "")}
                                  .example
                                </small>
                              </strong>
                            </span>
                            <span className="ns-tag">Active</span>
                            <span className="ns-muted">
                              Customer <ChevronRight size={15} />
                            </span>
                          </button>
                        );
                      })}
                    {!scenario.customers.some((customer) =>
                      customer.toLowerCase().includes(query.toLowerCase()),
                    ) && (
                      <p className="ns-empty">
                        No customers match your search.
                      </p>
                    )}
                  </div>
                </>
              )}
              {page === "customer" && (
                <>
                  <div className="ns-heading-row">
                    <div className="ns-customer-title">
                      <div className="ns-large-icon">
                        <Building2 size={26} />
                      </div>
                      <div>
                        <h1>{inputs.customer}</h1>
                        <p className="ns-subtitle">
                          Customer profile{" "}
                          <span className="ns-inline-dot">•</span>{" "}
                          <span className="ns-green">Active</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ns-tabs">
                    <button
                      id={id("tab-overview")}
                      className={!billing ? "selected" : ""}
                      onClick={() =>
                        click("tab-overview", "Overview", () =>
                          setBilling(false),
                        )
                      }
                    >
                      Overview
                    </button>
                    <button
                      id={id("tab-billing")}
                      className={billing ? "selected" : ""}
                      onClick={() =>
                        click("tab-billing", "Billing", () => setBilling(true))
                      }
                    >
                      {label("Billing")}
                    </button>
                    <span>Activity</span>
                  </div>
                  {!billing ? (
                    <div className="ns-detail-grid">
                      <article>
                        <h2>Company details</h2>
                        <dl>
                          <dt>Company name</dt>
                          <dd>{inputs.customer}</dd>
                          <dt>Account status</dt>
                          <dd>Active customer</dd>
                          <dt>Account owner</dt>
                          <dd>Jamie Davis</dd>
                        </dl>
                      </article>
                      <article>
                        <h2>A relationship worth keeping.</h2>
                        <p className="ns-muted">
                          Customer details, invoices, and activity, together in
                          one place.
                        </p>
                      </article>
                    </div>
                  ) : (
                    <>
                      <div className="ns-section-heading">
                        <div>
                          <h2>Invoices</h2>
                          <p className="ns-muted">
                            Manage billing for {inputs.customer}.
                          </p>
                        </div>
                        <button
                          id={id("new-invoice")}
                          className="ns-button-primary"
                          onClick={() =>
                            click("new-invoice", "New invoice", () => {
                              setInputs((current) => ({
                                ...current,
                                items: [blankItem()],
                                terms: "NET_30",
                              }));
                              setExported(false);
                              setPage("editor");
                            })
                          }
                        >
                          <Plus size={15} />
                          {label("New invoice")}
                        </button>
                      </div>
                      <div className="ns-empty-state">
                        <CreditCard size={32} />
                        <h3>Your billing starts here</h3>
                        <p>Create an invoice to keep business moving.</p>
                      </div>
                    </>
                  )}
                </>
              )}
              {page === "editor" && (
                <>
                  <button
                    id={id("back-customer")}
                    className="ns-back"
                    onClick={() =>
                      click("back-customer", "Back to customer", () =>
                        setPage("customer"),
                      )
                    }
                  >
                    <ArrowLeft size={14} />
                    Back to customer
                  </button>
                  <div className="ns-heading-row">
                    <div>
                      <h1>{label("New invoice")}</h1>
                      <p className="ns-subtitle">
                        A new invoice for {inputs.customer}.
                      </p>
                    </div>
                    <span className="ns-pill">Draft</span>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void createInvoice();
                    }}
                  >
                    <div className="ns-invoice-meta">
                      <div>
                        <small>BILL TO</small>
                        <strong>{inputs.customer}</strong>
                      </div>
                      <div>
                        <small>CURRENCY</small>
                        <strong>USD · US Dollar</strong>
                      </div>
                    </div>
                    <h2 className="ns-line-title">Line items</h2>
                    <div className="ns-items">
                      {inputs.items.map((item, index) => (
                        <div className="ns-item-row" key={index}>
                          <label>
                            {label(`Description ${index + 1}`)}
                            <input
                              id={id(`description-${index}`)}
                              required
                              value={item.description}
                              placeholder="e.g. Design services"
                              onChange={(e) =>
                                updateItem(index, "description", e.target.value)
                              }
                            />
                          </label>
                          <label>
                            {label(`Quantity ${index + 1}`)}
                            <input
                              id={id(`quantity-${index}`)}
                              required
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, "quantity", e.target.value)
                              }
                            />
                          </label>
                          <label>
                            {label(`Unit price ${index + 1}`)}
                            <input
                              id={id(`price-${index}`)}
                              required
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(index, "unitPrice", e.target.value)
                              }
                            />
                          </label>
                          <div className="ns-line-total">
                            <small>AMOUNT</small>
                            {currency(item.quantity * item.unitPrice)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      id={id("add-item")}
                      className="ns-add-item"
                      onClick={() =>
                        click("add-item", "Add line item", () =>
                          setInputs((current) => ({
                            ...current,
                            items: [...current.items, blankItem()],
                          })),
                        )
                      }
                    >
                      <Plus size={14} />
                      {label("Add line item")}
                    </button>
                    <div className="ns-invoice-bottom">
                      <label className="ns-terms">
                        {label("Payment terms")}
                        <select
                          id={id("payment-terms")}
                          value={inputs.terms}
                          onChange={(e) => {
                            record(
                              "select",
                              "payment-terms",
                              "combobox",
                              "Payment terms",
                              e.target.value,
                            );
                            setInputs((current) => ({
                              ...current,
                              terms: e.target.value as InvoiceInputs["terms"],
                            }));
                          }}
                        >
                          <option value="NET_15">
                            Net 15 — due in 15 days
                          </option>
                          <option value="NET_30">
                            Net 30 — due in 30 days
                          </option>
                          <option value="NET_60">
                            Net 60 — due in 60 days
                          </option>
                        </select>
                      </label>
                      <div className="ns-totals">
                        <div>
                          <span>Subtotal</span>
                          <span>{currency(total)}</span>
                        </div>
                        <div>
                          <strong>Total due</strong>
                          <strong>{currency(total)}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="ns-form-footer">
                      <span>All amounts in USD</span>
                      <button
                        id={id("save-invoice")}
                        disabled={busy}
                        type="submit"
                        className="ns-button-primary"
                      >
                        {busy ? "Creating…" : label("Create invoice")}
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </form>
                </>
              )}
              {page === "invoice" && invoice && (
                <>
                  <div className="ns-success">
                    <Check size={16} />
                    Invoice created successfully
                  </div>
                  <div className="ns-heading-row">
                    <div>
                      <h1>Invoice</h1>
                      <p className="ns-subtitle">
                        {invoice.id} · {inputs.customer}
                      </p>
                    </div>
                    <button
                      id={id("export-pdf")}
                      className="ns-button-primary"
                      disabled={busy}
                      onClick={() =>
                        click("export-pdf", "Export PDF", () => {
                          void exportPdf();
                        })
                      }
                    >
                      <FileText size={15} />
                      {busy ? "Exporting…" : label("Export PDF")}
                    </button>
                  </div>
                  <div className="ns-invoice-paper">
                    <div className="ns-paper-heading">
                      <strong>northstar</strong>
                      <span>INVOICE</span>
                    </div>
                    <div className="ns-invoice-meta">
                      <div>
                        <small>BILL TO</small>
                        <strong>{invoice.customer}</strong>
                      </div>
                      <div>
                        <small>PAYMENT TERMS</small>
                        <strong>{invoice.terms.replace("_", " ")}</strong>
                      </div>
                    </div>
                    {invoice.items.map((item, index) => (
                      <div className="ns-paper-item" key={index}>
                        <span>
                          {item.description}
                          <small>
                            {item.quantity} × {currency(item.unitPrice)}
                          </small>
                        </span>
                        <strong>
                          {currency(item.quantity * item.unitPrice)}
                        </strong>
                      </div>
                    ))}
                    <div className="ns-paper-total">
                      <span>Total due</span>
                      <strong>{currency(invoice.total)}</strong>
                    </div>
                  </div>
                  {exported && (
                    <p className="ns-exported" role="status">
                      <Check size={15} />
                      PDF exported. Your invoice is ready.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </section>
    </div>
  );
}
