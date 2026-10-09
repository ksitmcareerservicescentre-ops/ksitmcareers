"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  assignModuleAction,
  initializeModulesAction,
  listModulesAction,
  moduleRecordDetailAction,
  moduleRecordsAction,
  saveModuleAction,
  searchModuleStudentsAction,
} from "@/lib/modules-client";
import { moduleCatalog, parseModuleContent, statusLabels } from "@/lib/modules";
import {
  ModuleForm,
  ModulePreview,
  moduleButton,
  moduleInput,
  modulePanel,
} from "@/components/modules/module-form";

type Module = Awaited<ReturnType<typeof listModulesAction>>[number];
type Student = Awaited<ReturnType<typeof searchModuleStudentsAction>>[number];
const date = (value: Date | null) =>
  value ? new Date(value).toLocaleString() : "Not started";
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to complete the request. Please try again.";

export function ModulesWorkspace() {
  const [modules, setModules] = useState<Module[] | null>(null);
  const [selected, setSelected] = useState("");
  const [tab, setTab] = useState("manager");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    let active = true;
    listModulesAction()
      .then((rows) => {
        if (active) {
          setModules(rows);
          setSelected(rows[0]?.id || "");
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Modules could not load. Check the database connection and that the Modules migration has been applied.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const current = modules?.find((item) => item.id === selected);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
            Super Admin Workspace
          </div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Modules
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Curate reusable student activities, preview the interactive student workflow, and monitor real-time completion records.
          </p>
        </div>
      </div>
      <div
        role="tablist"
        aria-label="Modules views"
        className="inline-flex rounded-2xl border border-white/[0.08] bg-[#0c0c1e]/90 p-1.5 shadow-lg backdrop-blur-xl"
      >
        {[
          ["manager", "Module Manager"],
          ["preview", "Preview"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls="modules-view"
            className={
              tab === id
                ? moduleButton
                : "rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-white"
            }
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 backdrop-blur-sm">
          {error}
        </p>
      )}
      {!modules && !error && <p role="status" className="text-sm text-gray-400">Loading modules…</p>}
      {modules && modules.length < moduleCatalog.length && (
        <div className={modulePanel}>
          <p className="mb-4 text-sm text-gray-300">
            Create the eight module templates, then add your content and publish
            each module before assigning it.
          </p>
          <button
            className={moduleButton}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const rows = await initializeModulesAction();
                  setModules(rows);
                  setSelected(rows[0]?.id || "");
                  setError("");
                } catch (err) {
                  setError(message(err));
                }
              })
            }
          >
            Create module templates
          </button>
        </div>
      )}
      {!!modules?.length && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#111126] to-[#0c0c1e] p-5 shadow-lg backdrop-blur-xl">
          <label className="block w-full max-w-xl text-sm font-semibold text-gray-200">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
              Select module
            </span>
            <select
              aria-label="Select module"
              className={moduleInput}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {modules.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.title} · {item.isPublished ? "Published" : "Draft"}
                </option>
              ))}
            </select>
          </label>
          {current && (
            <div className="flex items-center gap-3 pt-4 sm:pt-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  current.isPublished
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    current.isPublished ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {current.isPublished ? "Published" : "Draft Template"}
              </span>
              <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-gray-400">
                v{current.version}
              </span>
            </div>
          )}
        </div>
      )}
      <div id="modules-view" role="tabpanel">
        {current && (
          <ModuleEditor
            key={current.id}
            module={current}
            previewOnly={tab === "preview"}
            onSave={(next) =>
              setModules((items) =>
                items!.map((item) => (item.id === next.id ? next : item)),
              )
            }
          />
        )}
      </div>
    </div>
  );
}

function ModuleEditor({
  module,
  previewOnly,
  onSave,
}: {
  module: Module;
  previewOnly: boolean;
  onSave: (module: Module) => void;
}) {
  const [title, setTitle] = useState(module.title);
  const [raw, setRaw] = useState(JSON.stringify(module.content, null, 2));
  const [published, setPublished] = useState(module.isPublished);
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();
  const [recordRefresh, setRecordRefresh] = useState(0);
  const parsed = useMemo(() => {
    try {
      return { content: parseModuleContent(raw), error: "" };
    } catch (error) {
      return { content: null, error: message(error) };
    }
  }, [raw]);
  const preview = parsed.content ? (
    <ModulePreview key={raw} title={title} content={parsed.content} />
  ) : (
    <p
      role="alert"
      className="rounded-xl border border-red-400/30 p-5 text-sm text-red-300"
    >
      Preview unavailable: {parsed.error}
    </p>
  );
  if (previewOnly) return <div className="mx-auto max-w-3xl">{preview}</div>;
  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <form
          className={`${modulePanel} space-y-4`}
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              try {
                const saved = await saveModuleAction({
                  id: module.id,
                  title,
                  raw,
                  isPublished: published,
                  version: module.version,
                });
                onSave(saved);
                setFeedback(
                  "Module saved. Existing assignments retain their original content.",
                );
              } catch (error) {
                setFeedback(message(error));
              }
            });
          }}
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Configuration
              </p>
              <h3 className="text-xl font-bold tracking-tight text-white">Module Manager</h3>
            </div>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-gray-400">
              v{module.version}
            </span>
          </div>
          <label className="block text-sm font-medium text-gray-200">
            Module title
            <input
              className={moduleInput}
              value={title}
              required
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-gray-200">
            Raw module data (JSON)
            <textarea
              spellCheck={false}
              className={`${moduleInput} min-h-96 font-mono text-xs leading-relaxed`}
              maxLength={100000}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-gray-300">
            Import JSON file
            <input
              type="file"
              accept=".json,application/json"
              className="mt-2 block w-full text-xs text-gray-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white file:transition-colors hover:file:bg-white/15"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 100000) {
                  setFeedback("Choose a JSON file smaller than 100 KB.");
                  return;
                }
                try {
                  setRaw(await file.text());
                  setFeedback("");
                } catch {
                  setFeedback("Unable to read this file.");
                }
              }}
            />
          </label>
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-5 text-gray-400">
            Use instructions, questions and resources. Each question needs a
            unique id, prompt, type and required flag. Types: TEXT,
            MULTIPLE_CHOICE (with options), SCALE_1_5. Resources need title and
            url. Use the preview to try changes before saving.
          </p>
          {parsed.error && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 backdrop-blur-sm">
              {parsed.error}
            </p>
          )}
          <label className="flex items-center gap-2.5 text-sm font-medium text-gray-200 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-[#070714] text-[#FF7F24] focus:ring-[#FF7F24]"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />{" "}
            Published and available for assignment
          </label>
          <div>
            <button
              className={moduleButton}
              disabled={pending || !parsed.content}
            >
              {pending ? "Saving…" : "Save module"}
            </button>
          </div>
          {feedback && (
            <p role="status" className="rounded-xl border border-orange-400/30 bg-orange-400/10 p-3 text-sm text-orange-200">
              {feedback}
            </p>
          )}
        </form>
        {preview}
      </div>
      <StudentAssignment
        module={module}
        onAssigned={() => setRecordRefresh((value) => value + 1)}
      />
      <ModuleRecords key={recordRefresh} moduleId={module.id} />
    </div>
  );
}

function StudentAssignment({
  module,
  onAssigned,
}: {
  module: Module;
  onAssigned: () => void;
}) {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[] | null>(null);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <section className={`${modulePanel} space-y-5`}>
      <div className="border-b border-white/[0.08] pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
          Cohort Assignment
        </span>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-white">Assign to a student</h3>
        <p className="mt-1 text-sm text-gray-400">
          Search by name, registration number or email. Assignment gives access to
          this module activity; existing career-service entitlements remain
          separate.
        </p>
      </div>
      {!module.isPublished && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-sm text-amber-300">
          Publish the module before assigning it to active students.
        </div>
      )}
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            try {
              setStudents(await searchModuleStudentsAction(query));
              setFeedback("");
            } catch (error) {
              setFeedback(message(error));
            }
          });
        }}
      >
        <label className="min-w-0 flex-1 text-sm font-medium text-gray-200">
          Search students
          <input
            className={moduleInput}
            value={query}
            minLength={2}
            maxLength={100}
            required
            placeholder="Search by name, registration number, or email…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button className={moduleButton} disabled={pending}>
          {pending ? "Searching…" : "Search"}
        </button>
      </form>
      <label className="block text-sm font-medium text-gray-200">
        Assignment note (optional)
        <textarea
          className={moduleInput}
          value={note}
          maxLength={2000}
          placeholder="Add personalized guidance or target deadlines for the student…"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {students?.length === 0 && (
        <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center text-sm text-gray-400">
          No active students matched your search query.
        </p>
      )}
      {students && students.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#0c0c1e]/70 p-4 shadow-sm transition-all hover:border-white/15 hover:bg-[#0c0c1e]"
            >
              <div className="flex items-start gap-3.5 min-w-0 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-sm font-bold text-orange-400">
                  {student.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white">{student.fullName}</p>
                  <p className="break-all text-xs text-gray-400">
                    {student.regNumber} · {student.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    {student.department || "No department"} ·{" "}
                    {student.level || "No level"}
                  </p>
                </div>
              </div>
              <button
                className={moduleButton}
                aria-label={`Assign module to ${student.fullName}`}
                disabled={pending || !module.isPublished}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      const result = await assignModuleAction(
                        module.id,
                        student.id,
                        note,
                      );
                      setFeedback(result.message);
                      onAssigned();
                    } catch (error) {
                      setFeedback(message(error));
                    }
                  })
                }
              >
                Assign module
              </button>
            </div>
          ))}
        </div>
      )}
      {students?.length === 20 && (
        <p className="text-xs text-gray-400">
          Showing the first 20 matches. Refine your search to find a specific
          student.
        </p>
      )}
      {feedback && (
        <p role="status" className="rounded-xl border border-orange-400/30 bg-orange-400/10 p-3 text-sm text-orange-200">
          {feedback}
        </p>
      )}
    </section>
  );
}

function ModuleRecords({ moduleId }: { moduleId: string }) {
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof moduleRecordsAction>
  > | null>(null);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof moduleRecordDetailAction>
  > | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    let active = true;
    moduleRecordsAction(moduleId, filter, search, page)
      .then((rows) => {
        if (active) {
          setData(rows);
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError("Unable to load student records. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [moduleId, filter, search, page, refresh]);
  return (
    <section className={`${modulePanel} space-y-6`}>
      <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">Student records</h3>
            <p className="text-xs text-gray-400">
              Most recently started first. Students who have not started appear after started records.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c1e]/60 p-4 shadow-sm md:flex-row md:items-end">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
          Status
          <select
            className={`${moduleInput} mt-1`}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
              setData(null);
            }}
          >
            <option value="ALL">All statuses</option>
            {Object.entries(statusLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <form
          className="flex flex-1 flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query);
            setPage(0);
            setData(null);
            setRefresh((value) => value + 1);
          }}
        >
          <label className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider text-gray-300">
            Find assigned student
            <input
              className={`${moduleInput} mt-1`}
              value={query}
              maxLength={100}
              placeholder="Search by name, reg number, or email…"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button className={moduleButton}>Filter records</button>
        </form>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {!data && !error && (
        <div className="flex items-center justify-center p-8 text-sm text-gray-400">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mr-2" />
          <p role="status">Loading records…</p>
        </div>
      )}

      {data && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0c0c1e]/60 shadow-lg">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-gray-400">
                <tr>
                  {[
                    "Student",
                    "Status",
                    "Started",
                    "Assigned",
                    "Completed",
                    "Record",
                  ].map((label) => (
                    <th className="whitespace-nowrap px-4 py-3" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {data.rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10 text-xs font-bold text-orange-400">
                          {row.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{row.fullName}</p>
                          <p className="text-xs text-orange-300/80 font-mono">{row.regNumber}</p>
                          <p className="break-all text-xs text-gray-400">{row.email}</p>
                          <p className="text-xs text-gray-500">
                            {row.department} {row.level}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.status === "COMPLETED"
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : row.status === "IN_PROGRESS"
                              ? "border border-orange-500/30 bg-orange-500/10 text-orange-300"
                              : "border border-blue-500/30 bg-blue-500/10 text-blue-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            row.status === "COMPLETED"
                              ? "bg-emerald-400"
                              : row.status === "IN_PROGRESS"
                                ? "bg-orange-400 animate-pulse"
                                : "bg-blue-400"
                          }`}
                        />
                        {statusLabels[row.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-300">
                      {date(row.startedAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-400">
                      {date(row.assignedAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-400">
                      {row.completedAt ? date(row.completedAt) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300 transition-all hover:border-orange-500/50 hover:bg-orange-500/20 disabled:opacity-50"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              setDetail(await moduleRecordDetailAction(row.id));
                            } catch (err) {
                              setError(message(err));
                            }
                          })
                        }
                      >
                        View record
                        <span className="sr-only"> for {row.fullName}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.rows.length && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-gray-400">
              No assignments match these filters.
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              className={moduleButton}
              disabled={page === 0}
              onClick={() => {
                setPage((value) => value - 1);
                setData(null);
              }}
            >
              Previous
            </button>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
              Page {page + 1}
            </span>
            <button
              className={moduleButton}
              disabled={!data.hasMore}
              onClick={() => {
                setPage((value) => value + 1);
                setData(null);
              }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {detail && (
        <div className="space-y-6 rounded-2xl border border-orange-500/30 bg-[#0c0c1e] p-6 shadow-2xl transition-all">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-lg font-bold text-orange-400">
                {detail.student.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  {detail.student.fullName}
                </h4>
                <p className="text-xs text-orange-300 font-mono">
                  {detail.student.regNumber}
                </p>
                <p className="text-xs text-gray-400">
                  {detail.student.department || "No department"} · {detail.student.level || "No level"} · {detail.student.phone || "No phone"}
                </p>
              </div>
            </div>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
              onClick={() => setDetail(null)}
            >
              Close record
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Status", statusLabels[detail.assignment.status]],
              ["Assigned by", detail.assignedByEmail],
              ["Assigned", date(detail.assignment.assignedAt)],
              ["Started", date(detail.assignment.startedAt)],
              [
                "Completed",
                detail.assignment.completedAt
                  ? date(detail.assignment.completedAt)
                  : "—",
              ],
              ["Last saved", date(detail.assignment.updatedAt)],
              ["Module version", `v${detail.assignment.moduleVersion}`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <dt className="text-xs font-medium text-gray-400">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-white break-words">
                  {value}
                </dd>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80 mb-1">
              Assignment Note
            </p>
            <p className="whitespace-pre-wrap text-gray-200">
              {detail.assignment.note || "None"}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h5 className="text-sm font-bold uppercase tracking-wider text-gray-300">
              Saved Student Responses
            </h5>
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <ModuleForm
                content={detail.assignment.content}
                answers={detail.assignment.answers}
                onChange={() => {}}
                disabled
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
