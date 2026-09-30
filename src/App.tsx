import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Braces,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  ExternalLink,
  FileCheck2,
  FileText,
  FlaskConical,
  FolderOpen,
  GitBranch,
  Globe2,
  Layers3,
  Loader2,
  Monitor,
  MousePointer2,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Workflow as WorkflowIcon,
  X,
  XCircle,
} from "lucide-react";
import { api } from "./api";
import type {
  InvoiceInputs,
  Run,
  Scenario,
  TraceEvent,
  Workflow,
} from "./types";

type View = "workflows" | "runs" | "lab" | "guide" | "settings";
type RuntimeHealth = {
  publicDemo: boolean;
  browser: "agentcore" | "local";
  cloud: boolean;
  compiler: string;
  model: string | null;
  region: string;
};
const LEVELS = [
  "Original interface",
  "Visual changes",
  "Changed selectors",
  "Rearranged layout",
  "Rewritten labels",
];
const DESCRIPTIONS = [
  "The interface used in the demonstration. A control for both execution methods.",
  "Colors, spacing, and ordering change. The underlying task stays the same.",
  "Element IDs change. Recorded selectors must still find their original targets.",
  "Navigation and forms move. The same customer and billing actions remain available.",
  "Visible labels change too. Semantic execution binds to equivalent action names.",
];
const PHASES = [
  {
    title: "Find the customer",
    text: "Locate the customer by name",
    icon: Search,
  },
  {
    title: "Open billing",
    text: "Find the invoice workspace",
    icon: FolderOpen,
  },
  {
    title: "Add line items",
    text: "Enter descriptions and amounts",
    icon: Layers3,
  },
  {
    title: "Set payment terms",
    text: "Apply the requested terms",
    icon: Clock3,
  },
  {
    title: "Create the invoice",
    text: "Persist the business record",
    icon: FileCheck2,
  },
  {
    title: "Export and verify",
    text: "Generate a PDF and check results",
    icon: ShieldCheck,
  },
];
const busy = (run?: Run | null) =>
  run?.status === "running" || run?.status === "queued";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
const date = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [view, setView] = useState<View>("workflows");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [health, setHealth] = useState<RuntimeHealth | null>(null);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [level, setLevel] = useState(2);
  const [seed, setSeed] = useState("48219");
  const [run, setRun] = useState<Run | null>(null);
  const [showRun, setShowRun] = useState(false);
  const [working, setWorking] = useState(false);
  const [teach, setTeach] = useState(false);
  const [preview, setPreview] = useState<Scenario | null>(null);
  const [query, setQuery] = useState("");
  const [labProgress, setLabProgress] = useState("");
  const mounted = useRef(true);
  const matchingWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(query.toLowerCase()),
  );
  const workflow =
    matchingWorkflows.find((w) => w.id === selected) || matchingWorkflows[0];
  const verified = runs.filter((r) => r.status === "passed");
  const completed = runs.filter((r) => !busy(r));
  const benchmarkSeed = /^\d+$/.test(seed) ? Number(seed) : NaN;
  const benchmarkRuns = completed.filter(
    (r) => r.workflowId === workflow?.id && r.seed === benchmarkSeed,
  );
  const cloudMode = health?.cloud === true;
  const remoteBrowser = health?.browser === "agentcore";
  const environmentLabel = !health
    ? "Checking configuration"
    : remoteBrowser
      ? "AgentCore configured"
      : health.publicDemo
        ? "Public demo · Playwright"
        : "Local browser configured";
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    Promise.all([
      api<Workflow[]>("/workflows"),
      api<Run[]>("/runs"),
      api<RuntimeHealth>("/health"),
    ])
      .then(([w, r, h]) => {
        if (!cancelled) {
          setWorkflows(w);
          setRuns(r);
          setHealth(h);
          setSelected(w[0]?.id || "");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e.message));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (working || !runs.some(busy)) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api<Run[]>("/runs")
        .then((next) => {
          if (cancelled) return;
          setRuns(next);
          setRun(
            (current) =>
              next.find((item) => item.id === current?.id) || current,
          );
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        });
    }, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [working, runs]);
  function updateRun(next: Run) {
    if (!mounted.current) return;
    setRun(next);
    setRuns((old) => [next, ...old.filter((r) => r.id !== next.id)]);
  }
  function validSeed() {
    const n = Number(seed);
    if (
      !/^\d+$/.test(seed) ||
      !Number.isSafeInteger(n) ||
      n < 0 ||
      n > 2147483647
    )
      throw new Error("Choose a whole-number seed between 0 and 2147483647.");
    return n;
  }
  async function execute(
    mode: "semantic" | "literal",
    mutationLevel = level,
  ): Promise<Run> {
    if (!workflow) throw new Error("Record a workflow first.");
    let next = await api<Run>("/runs", {
      workflowId: workflow.id,
      seed: validSeed(),
      level: mutationLevel,
      mode,
    });
    updateRun(next);
    while (busy(next) && mounted.current) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      next = await api<Run>(`/runs/${next.id}`);
      updateRun(next);
    }
    return next;
  }
  async function startRun(mode: "semantic" | "literal" = "semantic") {
    if (working) return;
    setWorking(true);
    setError("");
    setShowRun(true);
    setRun(null);
    try {
      await execute(mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution failed.");
    } finally {
      setWorking(false);
    }
  }
  async function compare(all = false) {
    if (working) return;
    setWorking(true);
    setError("");
    setShowRun(true);
    try {
      for (const l of all ? [0, 1, 2, 3, 4] : [level]) {
        for (const mode of ["literal", "semantic"] as const) {
          setLabProgress(
            `L${l} · ${mode === "literal" ? "Literal replay" : "Semantic execution"}`,
          );
          await execute(mode, l);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setLabProgress("");
      setWorking(false);
    }
  }
  async function showPreview() {
    setError("");
    try {
      setPreview(
        await api<Scenario>("/scenarios", { seed: validSeed(), level }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open preview.");
    }
  }
  function navigate(next: View) {
    setView(next);
    setQuery("");
  }
  const viewNames: Record<View, string> = {
    workflows: "Workflows",
    runs: "Run history",
    lab: "Mutation lab",
    guide: "How Once works",
    settings: "Settings",
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("workflows")}
          aria-label="Once home"
        >
          <span className="brand-mark">
            <span />
            <span />
          </span>
          once<span className="brand-dot">.</span>
        </button>
        <button
          className="workspace-switch"
          onClick={() => navigate("settings")}
        >
          <span className="workspace-icon">O</span>
          <span>
            Personal workspace<small>{environmentLabel}</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-caption">Workspace</div>
        <nav>
          {(
            [
              { id: "workflows", icon: Layers3, name: "Workflows" },
              { id: "runs", icon: Clock3, name: "Run history" },
              { id: "lab", icon: FlaskConical, name: "Mutation lab" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              aria-label={item.name}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
              className={`nav-item ${view === item.id ? "active" : ""}`}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
              {item.id === "workflows" && (
                <span className="nav-count">{workflows.length}</span>
              )}
              {item.id === "lab" && <span className="tiny-tag">Lab</span>}
            </button>
          ))}
        </nav>
        <div className="nav-caption resources">Resources</div>
        <button
          className={`nav-item ${view === "guide" ? "active" : ""}`}
          aria-label="How it works"
          onClick={() => navigate("guide")}
        >
          <BookOpen size={18} />
          <span>How it works</span>
          <ArrowUpRight size={14} />
        </button>
        <button
          className={`nav-item ${view === "settings" ? "active" : ""}`}
          aria-label="Settings"
          onClick={() => navigate("settings")}
        >
          <Settings2 size={18} />
          <span>Settings</span>
        </button>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="online-dot" />
            <strong>Made to run through change</strong>
            <p>
              One demonstration.
              <br />A workflow you can use again.
            </p>
            <button onClick={() => navigate("guide")}>
              Meet Once <ArrowRight size={14} />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">Y</div>
            <div>
              <strong>Your workspace</strong>
              <small>
                {health?.publicDemo ? "Synthetic demo" : "Local development"}
              </small>
            </div>
            <CircleHelp size={17} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="mobile-brand">once.</span>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{viewNames[view]}</strong>
          </div>
          <div className="topbar-right">
            <span className="environment">
              <span className="online-dot" />
              {environmentLabel}
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              onClick={() => navigate("guide")}
              aria-label="Help"
            >
              <CircleHelp size={18} />
            </button>
            <div className="avatar small">Y</div>
          </div>
        </header>
        <main>
          {error && (
            <div className="error-banner" role="alert">
              <XCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          {view === "workflows" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="heading-overline">
                    A little teaching. A lot less repeating.
                  </div>
                  <h1>
                    Your workflows<span className="title-dot">.</span>
                  </h1>
                  <p>
                    Teach a task once. Keep the intent, even when the interface
                    changes.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setTeach(true)}
                  disabled={working}
                >
                  <Plus size={17} />
                  New demonstration
                </button>
              </div>
              <section className="intro-banner">
                <div className="intro-copy">
                  <span className="small-pill">
                    <Sparkles size={13} />
                    Meet your repeat performer
                  </span>
                  <h2>
                    Same task. A different interface.
                    <br />
                    Still gets it done.
                  </h2>
                  <p>
                    Turn a demonstration into an inspectable workflow.
                    <br />
                    Then put it to the test with a little interface chaos.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => navigate("lab")}
                  >
                    Explore the mutation lab <ArrowRight size={15} />
                  </button>
                </div>
                <div className="intent-illustration" aria-hidden="true">
                  <div className="illustration-line" />
                  <div className="mini-browser before">
                    <div className="mini-top">
                      <i />
                      <i />
                      <i />
                      <span>Demonstration</span>
                    </div>
                    <div className="mini-content">
                      <div className="mini-nav" />
                      <div className="mini-form">
                        <b />
                        <i />
                        <i />
                        <em />
                      </div>
                    </div>
                    <div className="cursor">
                      <MousePointer2 size={23} fill="white" />
                    </div>
                  </div>
                  <div className="magic-node">
                    <WorkflowIcon size={25} />
                  </div>
                  <div className="mini-browser after">
                    <div className="mini-top">
                      <i />
                      <i />
                      <i />
                      <span>New interface</span>
                    </div>
                    <div className="mini-content">
                      <div className="mini-form">
                        <b />
                        <div className="mini-row">
                          <i />
                          <i />
                        </div>
                        <i />
                        <em />
                      </div>
                    </div>
                    <div className="illustration-check">
                      <Check size={16} />
                    </div>
                  </div>
                  <div className="intent-caption">
                    <ShieldCheck size={13} />
                    Intent preserved
                  </div>
                </div>
              </section>
              <div className="section-toolbar">
                <div className="section-tabs">
                  <button className="selected" onClick={() => setQuery("")}>
                    All workflows <span>{workflows.length}</span>
                  </button>
                </div>
                <div className="toolbar-tools">
                  <label className="search-field">
                    <Search size={15} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Find a workflow…"
                      aria-label="Find a workflow"
                    />
                  </label>
                  <span className="subtle">
                    {verified.length} verified runs
                  </span>
                </div>
              </div>
              {loading ? (
                <div className="empty-state">
                  <Loader2 className="spin" />
                  <h3>Opening your workspace</h3>
                </div>
              ) : !workflow ? (
                <div className="empty-state">
                  <WorkflowIcon />
                  <h3>
                    {query ? "No matching workflows" : "No workflows yet"}
                  </h3>
                  <p>
                    {query
                      ? "Try a different name or clear the search."
                      : "Record the invoice task to create your first workflow."}
                  </p>
                  <button
                    className="button primary"
                    onClick={() => (query ? setQuery("") : setTeach(true))}
                  >
                    {query ? "Clear search" : "New demonstration"}
                  </button>
                </div>
              ) : (
                <>
                  {workflows.length > 1 && (
                    <div className="workflow-picker">
                      {workflows
                        .filter((w) =>
                          w.name.toLowerCase().includes(query.toLowerCase()),
                        )
                        .map((w) => (
                          <button
                            className={w.id === workflow.id ? "selected" : ""}
                            key={w.id}
                            onClick={() => {
                              setSelected(w.id);
                              setTab("overview");
                            }}
                          >
                            <FileText size={15} />
                            {w.name}
                          </button>
                        ))}
                    </div>
                  )}
                  {workflow.name.toLowerCase().includes(query.toLowerCase()) ? (
                    <section className="workflow-card">
                      <div className="workflow-card-heading">
                        <div className="workflow-title">
                          <div className="workflow-icon">
                            <FileText size={23} />
                          </div>
                          <div>
                            <div className="title-row">
                              <h2>{workflow.name}</h2>
                              <span className="badge purple">
                                {workflow.source === "sample"
                                  ? "Example workflow"
                                  : "Recorded workflow"}
                              </span>
                            </div>
                            <p>
                              <Globe2 size={13} />
                              Northstar Operations{" "}
                              <span className="dot-separator" />
                              Invoice creation{" "}
                              <span className="dot-separator" />v
                              {workflow.version}
                            </p>
                          </div>
                        </div>
                        <button
                          className="button primary compact"
                          onClick={() => void startRun()}
                          disabled={working}
                        >
                          <Play size={14} fill="currentColor" />
                          {working ? "Running…" : "Run workflow"}
                        </button>
                      </div>
                      <div className="detail-tabs">
                        {[
                          ["overview", "Overview", WorkflowIcon],
                          ["spec", "Workflow spec", Code2],
                          ["trace", "Demonstration", MousePointer2],
                        ].map(([id, label, Icon]) => (
                          <button
                            key={id as string}
                            className={tab === id ? "selected" : ""}
                            onClick={() => setTab(id as string)}
                          >
                            {typeof Icon !== "string" && <Icon size={15} />}{" "}
                            {label as string}
                            {id === "trace" && (
                              <span>{workflow.events.length}</span>
                            )}
                          </button>
                        ))}
                        <span className="saved-indicator">
                          <CheckCheck size={14} />
                          Saved
                        </span>
                      </div>
                      {tab === "overview" ? (
                        <div className="workflow-body">
                          <div className="workflow-overview">
                            <div className="block-heading">
                              <h3>The workflow, understood</h3>
                              <span>
                                {workflow.steps.length} browser actions
                              </span>
                            </div>
                            <p className="section-description">
                              A clear path from your demonstration to a verified
                              result.
                            </p>
                            <div className="phase-grid">
                              {PHASES.map((phase, i) => (
                                <div className="phase" key={phase.title}>
                                  <div className="phase-icon">
                                    <phase.icon size={18} />
                                    <span>{i + 1}</span>
                                  </div>
                                  <div>
                                    <strong>{phase.title}</strong>
                                    <p>{phase.text}</p>
                                  </div>
                                  {i < 5 && (
                                    <ChevronRight
                                      className="phase-arrow"
                                      size={13}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="task-inputs">
                              <div className="input-summary-heading">
                                <span>
                                  <Box size={14} />
                                  Task inputs
                                </span>
                                <span className="subtle">
                                  From the demonstration
                                </span>
                              </div>
                              <div className="input-summary">
                                <div>
                                  <small>Customer</small>
                                  <strong>{workflow.inputs.customer}</strong>
                                </div>
                                <div>
                                  <small>Line items</small>
                                  <strong>
                                    {workflow.inputs.items.length} items{" "}
                                    <span className="subtle">
                                      /{" "}
                                      {money(
                                        workflow.inputs.items.reduce(
                                          (a, x) =>
                                            a + x.quantity * x.unitPrice,
                                          0,
                                        ),
                                      )}
                                    </span>
                                  </strong>
                                </div>
                                <div>
                                  <small>Payment terms</small>
                                  <strong>
                                    {workflow.inputs.terms
                                      .replace("_", " ")
                                      .replace("NET", "Net")}
                                  </strong>
                                </div>
                              </div>
                            </div>
                            <div className="safety-note">
                              <ShieldCheck size={15} />
                              <span>
                                Completed runs verify the saved invoice and
                                check that a PDF was exported.
                              </span>
                            </div>
                          </div>
                          <aside className="run-config">
                            <div className="block-heading">
                              <h3>Try a different interface</h3>
                              <FlaskConical size={16} />
                            </div>
                            <p>Change the surface. Keep the task.</p>
                            <label className="field-label" htmlFor="mutation">
                              UI mutation <span>L{level}</span>
                            </label>
                            <div className="level-selector">
                              {LEVELS.map((l, i) => (
                                <button
                                  key={l}
                                  title={l}
                                  aria-label={`L${i}: ${l}`}
                                  aria-pressed={level === i}
                                  onClick={() => setLevel(i)}
                                  disabled={working}
                                  className={level === i ? "selected" : ""}
                                >
                                  L{i}
                                </button>
                              ))}
                            </div>
                            <strong className="mutation-name">
                              {LEVELS[level]}
                            </strong>
                            <p className="mutation-description">
                              {DESCRIPTIONS[level]}
                            </p>
                            <div className="seed-field">
                              <label htmlFor="seed">Seed</label>
                              <input
                                id="seed"
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                                disabled={working}
                              />
                              <button
                                aria-label="Choose a new seed"
                                disabled={working}
                                onClick={() =>
                                  setSeed(
                                    String(Math.floor(Math.random() * 100000)),
                                  )
                                }
                              >
                                <RotateCcw size={14} />
                              </button>
                            </div>
                            <button
                              className="button secondary full"
                              onClick={() => void showPreview()}
                              disabled={working}
                            >
                              <Monitor size={15} />
                              Preview interface
                              <ArrowUpRight size={14} />
                            </button>
                          </aside>
                        </div>
                      ) : tab === "spec" ? (
                        <div className="spec-panel">
                          <div className="spec-toolbar">
                            <span>
                              <Braces size={16} />
                              {workflow.specVersion}{" "}
                              <span className="badge">{workflow.compiler}</span>
                            </span>
                            <button
                              className="button secondary compact"
                              onClick={() =>
                                download(`${workflow.id}.json`, workflow)
                              }
                            >
                              <ArrowDownToLine size={14} />
                              Export JSON
                            </button>
                          </div>
                          <pre>
                            {JSON.stringify(
                              {
                                spec_version: workflow.specVersion,
                                workflow: {
                                  id: workflow.id,
                                  name: workflow.name,
                                  version: workflow.version,
                                },
                                inputs: workflow.inputs,
                                steps: workflow.steps.map(
                                  ({
                                    id,
                                    intent,
                                    action,
                                    role,
                                    name,
                                    value,
                                    sourceEventIds,
                                  }) => ({
                                    id,
                                    intent,
                                    action,
                                    target: { role, name },
                                    ...(value !== undefined ? { value } : {}),
                                    provenance: sourceEventIds,
                                  }),
                                ),
                                invariants: [
                                  "synthetic_origin_only",
                                  "no_customer_edits",
                                  "no_deletion",
                                ],
                                verification: [
                                  "exact_customer",
                                  "exact_line_items",
                                  "exact_total",
                                  "payment_terms",
                                  "invoice_persisted",
                                  "pdf_generated",
                                ],
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      ) : (
                        <div className="trace-panel">
                          <div className="trace-explanation">
                            <MousePointer2 size={18} />
                            <p>
                              {workflow.source === "sample"
                                ? "This bundled example is a reference trace. Record your own demonstration to capture your interactions."
                                : "These interactions were captured from your demonstration in Northstar."}
                            </p>
                            <button
                              className="button secondary compact"
                              onClick={() =>
                                download(
                                  `${workflow.id}-trace.json`,
                                  workflow.events,
                                )
                              }
                            >
                              Export trace
                            </button>
                          </div>
                          {workflow.events.map((e, i) => (
                            <div className="trace-row" key={e.id}>
                              <span className="trace-index">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="badge">{e.type}</span>
                              <strong>{e.name}</strong>
                              <code>{e.value || e.selector}</code>
                            </div>
                          ))}
                        </div>
                      )}
                      <footer className="workflow-footer">
                        <span>
                          <GitBranch size={14} />
                          {workflow.source === "sample"
                            ? "Reference demonstration"
                            : "Your demonstration"}
                          <ChevronRight size={12} />
                          Semantic workflow
                          <ChevronRight size={12} />
                          Verified outcome
                        </span>
                        <button onClick={() => navigate("guide")}>
                          How it works
                          <ArrowUpRight size={13} />
                        </button>
                      </footer>
                    </section>
                  ) : (
                    <div className="empty-state">
                      <Search />
                      <h3>No matching workflows</h3>
                      <button
                        className="text-button"
                        onClick={() => setQuery("")}
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </>
              )}
              <section className="recent-section">
                <div className="block-heading">
                  <h2>Recent activity</h2>
                  <button
                    className="text-button subtle"
                    onClick={() => navigate("runs")}
                  >
                    View all runs <ArrowRight size={14} />
                  </button>
                </div>
                {runs.length ? (
                  <RunTable
                    runs={runs.slice(0, 3)}
                    onSelect={(r) => {
                      setRun(r);
                      setShowRun(true);
                    }}
                  />
                ) : (
                  <div className="quiet-empty">
                    <div className="quiet-empty-icon">
                      <Play size={17} />
                    </div>
                    <div>
                      <strong>Your next run starts the story.</strong>
                      <p>
                        Run a workflow to see its timeline, outcome, and
                        verification here.
                      </p>
                    </div>
                    <span className="badge">Ready when you are</span>
                  </div>
                )}
              </section>
            </>
          )}
          {view === "runs" && (
            <>
              <PageHeading
                title="Every run. Every result."
                description="Inspect the evidence behind each outcome. Run history includes real browser executions and their saved artifacts."
                action={
                  <button
                    className="button secondary"
                    disabled={!runs.length}
                    onClick={() => download("once-runs.json", runs)}
                  >
                    <ArrowDownToLine size={16} />
                    Export results
                  </button>
                }
              />
              <div className="metric-grid">
                <Metric
                  label="Total executions"
                  value={String(runs.length)}
                  detail="All recorded runs"
                />
                <Metric
                  label="Verified outcomes"
                  value={String(verified.length)}
                  detail="Independent checks passed"
                />
                <Metric
                  label="Success rate"
                  value={
                    completed.length
                      ? `${Math.round((verified.length / completed.length) * 100)}%`
                      : "—"
                  }
                  detail={`N = ${completed.length} completed runs`}
                />
              </div>
              <div className="panel">
                {runs.length ? (
                  <RunTable
                    runs={runs}
                    onSelect={(r) => {
                      setRun(r);
                      setShowRun(true);
                    }}
                  />
                ) : (
                  <Empty
                    icon={<Clock3 />}
                    title="A clean run history"
                    text="Run the example workflow or record your own to see real execution results."
                    action={
                      <button
                        className="button primary"
                        onClick={() => navigate("workflows")}
                      >
                        Go to workflows
                      </button>
                    }
                  />
                )}
              </div>
            </>
          )}
          {view === "lab" && (
            <>
              <PageHeading
                title="A little controlled chaos."
                description="Change the interface. Run both methods. Let the evidence do the talking."
                action={
                  <span className="badge purple">
                    <FlaskConical size={14} />
                    Mutation lab
                  </span>
                }
              />
              <div className="lab-layout">
                <section className="panel lab-controls">
                  <h2>Set up the experiment</h2>
                  <label className="field-label" htmlFor="lab-workflow">
                    Workflow
                  </label>
                  <select
                    id="lab-workflow"
                    value={workflow?.id || ""}
                    onChange={(e) => setSelected(e.target.value)}
                    disabled={working}
                  >
                    {workflows.map((w) => (
                      <option value={w.id} key={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <label className="field-label" htmlFor="lab-seed">
                    Reproducible seed
                  </label>
                  <input
                    id="lab-seed"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    disabled={working}
                  />
                  <div className="mutation-options">
                    {LEVELS.map((l, i) => (
                      <button
                        key={l}
                        onClick={() => setLevel(i)}
                        disabled={working}
                        className={level === i ? "selected" : ""}
                      >
                        <span>L{i}</span>
                        <div>
                          <strong>{l}</strong>
                          <p>
                            {i === 0
                              ? "Canonical control"
                              : DESCRIPTIONS[i].split(".")[0]}
                          </p>
                        </div>
                        <span className="radio-circle">
                          {level === i && <span />}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    className="button primary full"
                    disabled={working || !workflow}
                    onClick={() => void compare()}
                  >
                    {working ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                    Compare both methods
                  </button>
                  <button
                    className="button secondary full"
                    disabled={working || !workflow}
                    onClick={() => void compare(true)}
                  >
                    Run full benchmark · 10 executions
                  </button>
                  <p className="fine-print">
                    Each method gets fresh, isolated data with the same seed.
                    Execution is sequential.
                  </p>
                </section>
                <section className="panel lab-results">
                  <div className="block-heading">
                    <h2>Measured resilience</h2>
                    <button
                      className="icon-button"
                      aria-label="Export benchmark results"
                      disabled={!benchmarkRuns.length}
                      onClick={() =>
                        download("once-benchmark.json", benchmarkRuns)
                      }
                    >
                      <ArrowDownToLine size={17} />
                    </button>
                  </div>
                  <p className="section-description">
                    Success rate by mutation level for this workflow and seed.
                    Each bar includes all completed matching runs, including
                    earlier attempts.
                  </p>
                  <div className="chart-legend">
                    <span>
                      <i className="semantic-key" />
                      Semantic execution
                    </span>
                    <span>
                      <i className="literal-key" />
                      Literal replay
                    </span>
                  </div>
                  <div className="benchmark-chart">
                    {LEVELS.map((label, l) => {
                      const relevant = benchmarkRuns.filter(
                        (r) => r.level === l,
                      );
                      return (
                        <div className="chart-group" key={l}>
                          <div className="chart-bars">
                            {(["literal", "semantic"] as const).map((mode) => {
                              const group = relevant.filter(
                                (r) => r.mode === mode,
                              );
                              const pct = group.length
                                ? (group.filter((r) => r.status === "passed")
                                    .length /
                                    group.length) *
                                  100
                                : 0;
                              return (
                                <div className="bar-column" key={mode}>
                                  <span>
                                    {group.length ? `${Math.round(pct)}%` : "—"}
                                  </span>
                                  <div
                                    className={`chart-bar ${mode}`}
                                    style={{
                                      height: group.length
                                        ? `${Math.max(pct, 2)}%`
                                        : "2%",
                                    }}
                                  />
                                  <small>n={group.length}</small>
                                </div>
                              );
                            })}
                          </div>
                          <strong>L{l}</strong>
                          <small>{label}</small>
                        </div>
                      );
                    })}
                  </div>
                  <div className="lab-note">
                    <ShieldCheck size={20} />
                    <div>
                      <strong>Success is checked, not guessed.</strong>
                      <p>
                        The verifier checks the persisted customer, line items,
                        amount, and terms. It also checks that an exported PDF
                        has a valid header and nonempty bytes. Missing evidence
                        fails the run.
                      </p>
                    </div>
                  </div>
                  {labProgress && (
                    <p className="running-line">
                      <Loader2 size={16} className="spin" />
                      Running {labProgress}
                    </p>
                  )}
                  <button
                    className="text-button"
                    onClick={() => navigate("runs")}
                  >
                    Explore individual runs
                    <ArrowRight size={15} />
                  </button>
                </section>
              </div>
            </>
          )}
          {view === "guide" && (
            <>
              <PageHeading
                title="Show it once."
                description="A small laboratory for a simple question: can a workflow survive a changing interface?"
              />
              <div className="guide-flow">
                {[
                  {
                    icon: MousePointer2,
                    title: "Teach",
                    text: "Complete the invoice task in Northstar. Once records the visible targets and your input.",
                  },
                  {
                    icon: Braces,
                    title: "Compile",
                    text: cloudMode
                      ? "Amazon Bedrock interprets the supported invoice demonstration into a versioned workflow with trace provenance."
                      : "The local compiler maps the supported invoice demonstration to a versioned workflow with trace provenance.",
                  },
                  {
                    icon: FlaskConical,
                    title: "Change",
                    text: "Use a reproducible seed to change selectors, layout, and labels without changing the business task.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Prove",
                    text: "A browser executes the workflow. Independent checks inspect the saved invoice and generated PDF.",
                  },
                ].map((x, i) => (
                  <section className="panel guide-step" key={x.title}>
                    <span className="step-number">0{i + 1}</span>
                    <x.icon size={25} />
                    <h2>{x.title}</h2>
                    <p>{x.text}</p>
                  </section>
                ))}
              </div>
              <div className="guide-bottom">
                <section className="panel">
                  <h2>Two methods, one fair test</h2>
                  <p>
                    Literal replay uses the selectors captured in the
                    demonstration.{" "}
                    {cloudMode
                      ? "Semantic execution uses Amazon Bedrock to select targets from visible browser controls."
                      : "Semantic execution resolves visible roles and supported equivalent labels at runtime."}{" "}
                    Both act through a real browser and receive isolated
                    business data.
                  </p>
                  <p>
                    {cloudMode
                      ? "Bedrock compilation is configured for the supported invoice task."
                      : "The local compiler is deterministic and invoice-specific."}{" "}
                    Workflows retain the recorded action sequence. Once does not
                    train a model or claim general-purpose learning.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => navigate("lab")}
                  >
                    <FlaskConical size={16} />
                    Open the mutation lab
                  </button>
                </section>
                <section className="panel">
                  <h2>Clear boundaries</h2>
                  <ul className="check-list">
                    <li>
                      <Check />
                      Synthetic Northstar data only
                    </li>
                    <li>
                      <Check />
                      No arbitrary website or external URL input
                    </li>
                    <li>
                      <Check />
                      No evaluator endpoint exposed to the executor
                    </li>
                    <li>
                      <Check />
                      Actual browser screenshots and PDF artifacts
                    </li>
                    <li>
                      <Check />
                      Bounded runs with browser cleanup
                    </li>
                  </ul>
                  <span className="badge">{environmentLabel}</span>
                </section>
              </div>
            </>
          )}
          {view === "settings" && (
            <>
              <PageHeading
                title="Your environment."
                description="Know exactly where your workflows run and where their evidence lives."
              />
              <section className="panel settings-panel">
                <div className="settings-row">
                  <div className="settings-icon">
                    <Monitor />
                  </div>
                  <div>
                    <h3>Browser runtime</h3>
                    <p>
                      {!health
                        ? "Waiting for runtime configuration."
                        : remoteBrowser
                          ? "AgentCore runs the remote browser. A bounded, same-origin bridge serves the local Northstar fixture to that browser."
                          : "Playwright browser. Executions run on the application server."}
                    </p>
                  </div>
                  <span className="badge green">
                    {health ? "Configured" : "Loading"}
                  </span>
                </div>
                <div className="settings-row">
                  <div className="settings-icon">
                    <Sparkles />
                  </div>
                  <div>
                    <h3>Workflow compiler</h3>
                    <p>
                      {!health
                        ? "Waiting for compiler configuration."
                        : cloudMode
                          ? `Amazon Bedrock (${health.model ?? "model not specified"}) interprets the supported invoice demonstration. Existing workflows keep their original compiler provenance.`
                          : "Deterministic compiler for the supported Northstar invoice flow."}
                    </p>
                  </div>
                  <span className="badge">{health?.compiler ?? "Loading"}</span>
                </div>
                <div className="settings-row">
                  <div className="settings-icon">
                    <Globe2 />
                  </div>
                  <div>
                    <h3>Amazon Bedrock AgentCore</h3>
                    <p>
                      {!health
                        ? "Waiting for AWS configuration."
                        : remoteBrowser
                          ? `Configured in ${health.region}. Configuration does not establish that a run has passed; inspect run evidence for results.`
                          : "AgentCore browser execution is not configured."}
                    </p>
                  </div>
                  <span className="badge">
                    {!health
                      ? "Loading"
                      : remoteBrowser
                        ? "Configured"
                        : "Not configured"}
                  </span>
                </div>
                <div className="settings-row">
                  <div className="settings-icon">
                    <ShieldCheck />
                  </div>
                  <div>
                    <h3>Evidence storage</h3>
                    <p>
                      Workflows, run results, screenshots, and PDFs are stored
                      on the application server.{" "}
                      {health?.publicDemo
                        ? "Demo history resets when the server is replaced."
                        : "History persists in the local data directory."}
                    </p>
                  </div>
                  <span className="badge green">On the server</span>
                </div>
              </section>
              <p className="settings-footnote">
                {health?.publicDemo
                  ? "Public synthetic demo. Use the included fictional customers and sample data."
                  : "Once is a local development workspace. Keep the control plane on a trusted machine."}
              </p>
            </>
          )}
          <footer className="app-footer">
            <span>Show it once. Run through change.</span>
            <span>
              <span className="online-dot" />
              {environmentLabel} <span className="dot-separator" />
              Once v0.1
            </span>
          </footer>
        </main>
      </div>
      {teach && (
        <TeachModal
          onClose={() => setTeach(false)}
          onSaved={(w) => {
            setWorkflows((old) => [w, ...old]);
            setSelected(w.id);
            setTab("overview");
            setTeach(false);
            navigate("workflows");
          }}
        />
      )}
      {preview && (
        <Modal
          title={`Northstar · L${preview.level} · Seed ${preview.seed}`}
          onClose={() => setPreview(null)}
          wide
        >
          <div className="preview-note">
            <FlaskConical size={16} />
            This is an isolated preview. Changes here do not affect workflow
            runs.
          </div>
          <iframe
            className="northstar-frame preview"
            title="Northstar interface preview"
            src={`/northstar?scenario=${preview.id}`}
          />
        </Modal>
      )}
      {showRun && (
        <Modal
          title={
            run
              ? `${run.mode === "semantic" ? "Semantic execution" : "Literal replay"} · L${run.level}`
              : "Starting browser execution"
          }
          onClose={() => setShowRun(false)}
          wide
        >
          <RunDetails
            run={run}
            progress={labProgress}
            onDownload={() => run && download(`${run.id}.json`, run)}
          />
        </Modal>
      )}
    </div>
  );
}

function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading secondary-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="panel metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function RunTable({
  runs,
  onSelect,
}: {
  runs: Run[];
  onSelect: (run: Run) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="runs-table">
        <thead>
          <tr>
            <th>Workflow</th>
            <th>Method</th>
            <th>Interface</th>
            <th>Outcome</th>
            <th>Started</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} onClick={() => onSelect(r)}>
              <td>
                <span className="table-workflow">
                  <FileText size={17} />
                  {r.workflowName}
                </span>
              </td>
              <td>{r.mode === "semantic" ? "Semantic" : "Literal replay"}</td>
              <td>
                <span className="badge">L{r.level}</span>{" "}
                <span className="subtle">#{r.seed}</span>
              </td>
              <td>
                <Status run={r} />
              </td>
              <td className="subtle">{date(r.startedAt)}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Inspect run ${r.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(r);
                  }}
                >
                  <ArrowUpRight size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Status({ run }: { run: Run }) {
  return (
    <span
      className={`badge ${run.status === "passed" ? "green" : run.status === "failed" ? "red" : "purple"}`}
    >
      {busy(run) ? (
        <Loader2 className="spin" size={12} />
      ) : run.status === "passed" ? (
        <Check size={12} />
      ) : (
        <X size={12} />
      )}{" "}
      {run.status === "passed"
        ? "Verified"
        : run.status === "failed"
          ? "Failed"
          : "Running"}
    </span>
  );
}
function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          autoFocus
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function RunDetails({
  run,
  progress,
  onDownload,
}: {
  run: Run | null;
  progress: string;
  onDownload: () => void;
}) {
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  useEffect(() => setSelectedFrame(null), [run?.id]);
  if (!run)
    return (
      <div className="empty-state">
        <Loader2 className="spin" />
        <h3>Opening the browser</h3>
        <p>This can take a moment on the first run.</p>
      </div>
    );
  return (
    <div className="run-details">
      <div className="run-meta">
        <Status run={run} />
        <span>{run.workflowName}</span>
        <span className="subtle">Seed {run.seed}</span>
        <span className="subtle">
          {run.durationMs
            ? `${(run.durationMs / 1000).toFixed(1)}s`
            : "In progress"}
        </span>
        <button className="button secondary compact" onClick={onDownload}>
          <ArrowDownToLine size={14} />
          Export evidence
        </button>
      </div>
      {progress && (
        <div className="comparison-progress">
          <Loader2 className="spin" size={14} />
          {progress}
        </div>
      )}
      <div className="execution-layout">
        <div className="browser-evidence">
          <div className="browser-evidence-bar">
            <span className="browser-dots">● ● ●</span>
            <span>
              <Globe2 size={12} />
              northstar.local
            </span>
            {selectedFrame ? (
              <button
                className="text-button"
                onClick={() => setSelectedFrame(null)}
              >
                Latest frame
              </button>
            ) : (
              <span>Browser evidence</span>
            )}
          </div>
          {run.screenshot ? (
            <img
              src={selectedFrame || run.screenshot}
              alt="Actual browser screenshot from this execution"
            />
          ) : (
            <div className="screenshot-placeholder">
              <Monitor size={36} />
              <p>
                {busy(run)
                  ? "Waiting for the first browser frame…"
                  : "No screenshot captured for this run."}
              </p>
            </div>
          )}
        </div>
        <div className="execution-timeline">
          <h3>Execution timeline</h3>
          {run.events.length ? (
            run.events.map((e, i) => (
              <div
                className={`execution-event ${e.status}`}
                key={`${i}-${e.step}`}
              >
                <span className="event-marker">
                  {e.status === "passed" ? (
                    <Check size={12} />
                  ) : e.status === "failed" ? (
                    <X size={12} />
                  ) : (
                    <span />
                  )}
                </span>
                <div>
                  <strong>{e.step}</strong>
                  <p>{e.message}</p>
                  {e.screenshot && (
                    <button
                      className="text-button frame-link"
                      onClick={() => setSelectedFrame(e.screenshot!)}
                    >
                      View frame <Monitor size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="subtle">Browser starting…</p>
          )}
        </div>
      </div>
      {run.error && (
        <div className="run-error">
          <XCircle size={17} />
          <p>{run.error}</p>
        </div>
      )}
      <section className="verification">
        <div className="block-heading">
          <h3>
            <ShieldCheck size={18} />
            Independent verification
          </h3>
          {run.pdfUrl && (
            <a
              className="button secondary compact"
              href={run.pdfUrl}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={14} />
              Open invoice PDF
              <ExternalLink size={12} />
            </a>
          )}
        </div>
        {run.checks.length ? (
          <div className="check-grid">
            {run.checks.map((c) => (
              <div
                className={`verification-check ${c.passed ? "passed" : "failed"}`}
                key={c.label}
              >
                {c.passed ? <Check size={16} /> : <X size={16} />}
                <div>
                  <strong>{c.label}</strong>
                  <p>{c.actual || `Expected ${c.expected}`}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="subtle">
            {busy(run)
              ? "Business checks will run after browser execution."
              : "No business checks completed. This run is not verified."}
          </p>
        )}
      </section>
    </div>
  );
}

function TeachModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (workflow: Workflow) => void;
}) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [inputs, setInputs] = useState<InvoiceInputs | null>(null);
  const [name, setName] = useState("Create customer invoice");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    let cancelled = false;
    api<Scenario>("/scenarios", { seed: 0, level: 0 })
      .then((s) => {
        if (!cancelled) setScenario(s);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    function message(e: MessageEvent) {
      if (
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow ||
        !e.data ||
        typeof e.data !== "object"
      )
        return;
      if (
        e.data.type === "once:trace" &&
        e.data.event &&
        typeof e.data.event.id === "string"
      ) {
        setEvents((old) => [...old, e.data.event as TraceEvent]);
      }
      if (e.data.type === "once:complete" && e.data.inputs)
        setInputs(e.data.inputs as InvoiceInputs);
    }
    window.addEventListener("message", message);
    return () => window.removeEventListener("message", message);
  }, []);
  async function save() {
    setSaving(true);
    setError("");
    try {
      onSaved(await api<Workflow>("/workflows", { name, events, inputs }));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not compile demonstration.",
      );
      setSaving(false);
    }
  }
  return (
    <Modal title="Teach Once a workflow" onClose={onClose} wide>
      <div className="teach-instructions">
        <div className="recording-badge">
          <Radio size={16} />
          {inputs ? "Demonstration complete" : "Recording your demonstration"}
        </div>
        <p>
          Find <strong>Acme Robotics</strong>. Create an invoice with{" "}
          <strong>Consulting · 3 × $250</strong> and{" "}
          <strong>Cloud audit · 1 × $500</strong>. Set <strong>Net 30</strong>,
          then export the PDF.
        </p>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {scenario ? (
        <iframe
          ref={frame}
          className="northstar-frame"
          title="Record a workflow in Northstar"
          src={`/northstar?scenario=${scenario.id}&record=1`}
        />
      ) : (
        <div className="empty-state">
          <Loader2 className="spin" />
          Preparing your demonstration…
        </div>
      )}
      <div className="teach-footer">
        <div>
          <label htmlFor="workflow-name">Workflow name</label>
          <input
            id="workflow-name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <span className="subtle">{events.length} captured events</span>
        <button
          className="button primary"
          disabled={!inputs || !events.length || !name.trim() || saving}
          onClick={() => void save()}
        >
          {saving ? (
            <Loader2 className="spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          Compile & save workflow
        </button>
      </div>
    </Modal>
  );
}
