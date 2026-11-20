"use client";

/** Journal tab (E-10, FR-8, US-20/21/22). On-device only; text is never rendered as HTML. */
import { Mandala } from "@/components/Mandala";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import { LeafIcon } from "@phosphor-icons/react/dist/csr/Leaf";
import { HeartIcon } from "@phosphor-icons/react/dist/csr/Heart";
import { SmileyMehIcon } from "@phosphor-icons/react/dist/csr/SmileyMeh";
import { WindIcon } from "@phosphor-icons/react/dist/csr/Wind";
import { CloudIcon } from "@phosphor-icons/react/dist/csr/Cloud";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { useI18n } from "@/i18n/client";
import { formatDateKey, formatTime } from "@/i18n/format";
import { track } from "@/features/analytics";
import type { JournalContent } from "@/features/shared/content.server";
import { downloadText, todayKey, userTimeZone } from "@/features/shared/device";
import { useS } from "@/features/shared/strings";
import { useDeviceValue } from "@/features/shared/use-device";
import { btn, card, ConfirmDialog, Status } from "@/features/shared/ui";
import { getStorage, newId, requestPersistence, StorageError, type StorageBackend } from "@/lib/storage";
import { JOURNAL_MAX_CHARS, type JournalEntry, type Mood } from "@/lib/types";
import { EnglishMark } from "@/components/ObservanceBody";
import { buildEntry, exportFileName, journalToJson, journalToText, MOOD_CONTENT_KEY, MOOD_ORDER, promptIndexFor, validateDraft } from "./logic";

const MOOD_ICON: Record<Mood, Icon> = { peaceful: LeafIcon, grateful: HeartIcon, okay: SmileyMehIcon, restless: WindIcon, heavy: CloudIcon };

/** Export buttons, reused on the Me screen (US-22). */
export function JournalExport({ content, entries }: { content: JournalContent; entries: JournalEntry[] | null }) {
  const s = useS();
  const { locale } = useI18n();
  const [status, setStatus] = useState<string | null>(null);
  const empty = !entries || entries.length === 0;
  const promptText = (id: string) => content.prompts.find((p) => p.id === id)?.text ?? null;
  const moodLabel = (m: Mood) => content.moods[MOOD_CONTENT_KEY[m]]?.label ?? m;
  const tz = userTimeZone;

  const exportAs = (fmt: "txt" | "json") => {
    if (!entries || empty) return;
    const today = todayKey();
    const body =
      fmt === "txt"
        ? journalToText(entries, {
            header: s("journal.export.header", { date: formatDateKey(today, locale, { day: "numeric", month: "long", year: "numeric" }) }),
            formatDate: (e) => s("journal.entryDate", { date: formatDateKey(e.localDate, locale), time: formatTime(e.createdAt, locale, tz()) }),
            promptLine: (id) => {
              const t = promptText(id);
              return t ? s("journal.export.prompt", { text: t }) : null;
            },
            moodLine: (m) => s("journal.export.mood", { label: moodLabel(m) }),
          })
        : journalToJson(entries, promptText, moodLabel, new Date().toISOString());
    downloadText(exportFileName(today, fmt), fmt === "txt" ? "text/plain" : "application/json", body);
    setStatus(s("journal.exportDone"));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <button type="button" className={btn.secondary} disabled={empty} onClick={() => exportAs("txt")}>
          <DownloadSimpleIcon size={20} aria-hidden="true" />
          {s("journal.exportTxt")}
        </button>
        <button type="button" className={btn.secondary} disabled={empty} onClick={() => exportAs("json")}>
          <DownloadSimpleIcon size={20} aria-hidden="true" />
          {s("journal.exportJson")}
        </button>
      </div>
      {empty ? <p className="text-[0.875rem] leading-5 text-text-muted">{s("journal.exportEmpty")}</p> : null}
      <Status message={status} />
    </div>
  );
}

export function JournalView({ content }: { content: JournalContent }) {
  const s = useS();
  const { locale } = useI18n();
  const textId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [backend, setBackend] = useState<StorageBackend | null>(null);
  const [writing, setWriting] = useDeviceValue(() => {
    try {
      return new URLSearchParams(window.location.search).get("new") === "1";
    } catch {
      return false;
    }
  }, false);
  const [promptIdx, setPromptIdx] = useDeviceValue(() => {
    // A plan card can ask for a specific prompt (?prompt=prompt.02); otherwise today's prompt.
    try {
      const want = new URLSearchParams(window.location.search).get("prompt");
      const i = content.prompts.findIndex((p) => p.id === want);
      if (i >= 0) return i;
    } catch {
      /* ignore */
    }
    return promptIndexFor(todayKey(), content.prompts.length);
  }, 0);
  const [mood, setMood] = useState<Mood | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<JournalEntry | null>(null);
  const [discard, setDiscard] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const st = await getStorage();
      setBackend(st.backend);
      setEntries(await st.journal.list());
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    getStorage()
      .then((st) => {
        setBackend(st.backend);
        return st.journal.list();
      })
      .then(setEntries, () => setEntries([]));
  }, []);

  useEffect(() => {
    if (writing) textRef.current?.focus();
  }, [writing]);

  const prompt = content.prompts[promptIdx] ?? null;
  const moodLabel = (m: Mood) => content.moods[MOOD_CONTENT_KEY[m]]?.label ?? m;

  const reset = () => {
    setText("");
    setMood(null);
    setError(null);
    setWriting(false);
  };

  const save = async () => {
    const err = validateDraft(text);
    if (err) {
      setError(err === "empty" ? s("journal.empty.text") : s("journal.text.tooLong"));
      textRef.current?.focus();
      return;
    }
    try {
      const st = await getStorage();
      const entry = buildEntry({
        id: newId(),
        text,
        mood,
        promptId: prompt?.id ?? null,
        locale,
        localDate: todayKey(),
        now: Date.now(),
      });
      await st.journal.put(entry);
      void requestPersistence(); // ADR-005, L5 2.6: denial is handled silently
      track("journal_saved", {});
      try {
        if (new URLSearchParams(window.location.search).get("src") === "plan") {
          // PRD §6: a saved reflection completes the plan's reflection step.
          track("practice_completed", { type: "reflection", planned_min: 1, actual_min: 1, entry: "plan" });
        }
      } catch {
        /* ignore */
      }
      reset();
      setStatus(s("journal.saved"));
      await refresh();
    } catch (e) {
      setError(e instanceof StorageError && e.code === "quota" ? s("error.storageFull") : s("error.generic"));
    }
  };

  const confirmDelete = async () => {
    const e = toDelete;
    setToDelete(null);
    if (!e) return;
    try {
      const st = await getStorage();
      await st.journal.delete(e.id);
      setStatus(s("journal.deleted"));
      await refresh();
    } catch {
      setStatus(s("error.generic"));
    }
  };

  const dateLabel = (e: JournalEntry) =>
    s("journal.entryDate", { date: formatDateKey(e.localDate, locale), time: formatTime(e.createdAt, locale, userTimeZone()) });
  const tooLong = text.length > JOURNAL_MAX_CHARS;

  return (
    <div className="flex flex-col gap-6">
      <h1>{s("journal.title")}</h1>
      {backend === "memory" ? (
        <p role="alert" className="rounded-md bg-warning-tint p-3">
          {s("error.storage")}
        </p>
      ) : null}
      <Status message={status} />

      {writing ? (
        <form
          className={`${card} flex flex-col gap-4`}
          aria-labelledby="write-h"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h2 id="write-h" className="sr-only">
            {s("journal.new")}
          </h2>
          {prompt ? (
            <div>
              <p className="text-[0.875rem] leading-5 font-semibold text-text-muted">{s("journal.prompt")}</p>
              <p className="text-[1.125rem] leading-7">
                <span lang={prompt.lang}>{prompt.text}</span>
                {prompt.lang === "en" ? <EnglishMark /> : null}
              </p>
              <button type="button" className={`${btn.ghost} -ml-4`} onClick={() => setPromptIdx((promptIdx + 1) % content.prompts.length)}>
                {s("journal.prompt.another")}
              </button>
            </div>
          ) : null}

          <fieldset>
            <legend className="mb-2 font-semibold">
              {s("journal.mood.q")} <span className="font-normal text-text-muted">({s("common.optional")})</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {MOOD_ORDER.map((m) => {
                const I = MOOD_ICON[m];
                return (
                  <button key={m} type="button" className={btn.chip} aria-pressed={mood === m} onClick={() => setMood(mood === m ? null : m)}>
                    <I size={20} aria-hidden="true" />
                    {moodLabel(m)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1">
            <label htmlFor={textId} className="font-semibold">
              {s("journal.text.label")}
            </label>
            <textarea
              id={textId}
              ref={textRef}
              rows={6}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              placeholder={s("journal.text.placeholder")}
              aria-describedby={`${textId}-count ${textId}-notice${error ? ` ${textId}-err` : ""}`}
              aria-invalid={tooLong || !!error}
              className="rounded-md border border-border-input bg-surface p-3 text-text"
            />
            <p id={`${textId}-count`} className={`text-[0.875rem] leading-5 ${tooLong ? "text-error" : "text-text-muted"}`} aria-live="polite">
              {s("journal.text.count", { count: text.length })}
            </p>
            {error ? (
              <p id={`${textId}-err`} role="alert" className="text-error">
                {error}
              </p>
            ) : null}
          </div>

          <p id={`${textId}-notice`} className="rounded-md bg-surface-2 p-3 text-[0.875rem] leading-5">
            {s("journal.noticeShared")}
          </p>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className={btn.primary} disabled={tooLong}>
              {s("journal.save")}
            </button>
            <button type="button" className={btn.ghost} onClick={() => (text.trim() ? setDiscard(true) : reset())}>
              {s("common.cancel")}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          {prompt && entries && entries.length > 0 ? <p className="text-text-muted">{prompt.text}</p> : null}
          <button type="button" className={btn.primary} onClick={() => setWriting(true)}>
            <PencilSimpleIcon size={20} aria-hidden="true" />
            {s("journal.new")}
          </button>
        </div>
      )}

      {entries === null ? (
        <div aria-busy="true" className="min-h-24" />
      ) : entries.length === 0 ? (
        !writing ? (
          <section className={`${card} relative isolate overflow-hidden text-center`} aria-labelledby="empty-h">
            <Mandala className="mx-auto mb-2 h-20 w-20 text-[var(--accent)]" />
            <h2 id="empty-h" className="text-[1.125rem] leading-[1.625rem]">
              {s("journal.empty.title")}
            </h2>
            <p className="mt-1 text-text-muted">{s("journal.empty.body")}</p>
            {prompt ? <p className="mt-3 italic">{prompt.text}</p> : null}
          </section>
        ) : null
      ) : (
        <section aria-labelledby="list-h">
          <h2 id="list-h" className="mb-3">
            {s("journal.list")}
          </h2>
          <ul className="flex flex-col gap-3">
            {entries.map((e) => {
              const I = e.mood ? MOOD_ICON[e.mood] : null;
              const p = e.promptId ? content.prompts.find((x) => x.id === e.promptId) : null;
              return (
                <li key={e.id} className={card}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-[0.875rem] leading-5 text-text-muted">{dateLabel(e)}</p>
                      {e.mood && I ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-[0.875rem] leading-5 font-semibold">
                          <I size={16} aria-hidden="true" />
                          {moodLabel(e.mood)}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={btn.icon}
                      aria-label={`${s("common.delete")}: ${dateLabel(e)}`}
                      onClick={() => setToDelete(e)}
                    >
                      <TrashIcon size={20} aria-hidden="true" />
                    </button>
                  </div>
                  {p ? <p className="mt-2 text-[0.875rem] leading-5 text-text-muted italic">{p.text}</p> : null}
                  <p className="mt-2 whitespace-pre-wrap">{e.text}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="export-h" className="flex flex-col gap-2">
        <h2 id="export-h" className="text-[1.125rem] leading-[1.625rem]">
          {s("journal.export")}
        </h2>
        <JournalExport content={content} entries={entries} />
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        title={s("journal.delete.title")}
        body={
          <>
            <p className="font-semibold text-text">{toDelete ? dateLabel(toDelete) : ""}</p>
            <p>{s("journal.delete.body")}</p>
          </>
        }
        confirmLabel={s("journal.delete.confirm")}
        cancelLabel={s("journal.delete.keep")}
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
      <ConfirmDialog
        open={discard}
        title={s("journal.discard.title")}
        body={<p>{s("journal.discard.body")}</p>}
        confirmLabel={s("journal.discard.confirm")}
        cancelLabel={s("journal.discard.keep")}
        onCancel={() => setDiscard(false)}
        onConfirm={() => {
          setDiscard(false);
          reset();
        }}
      />
    </div>
  );
}
