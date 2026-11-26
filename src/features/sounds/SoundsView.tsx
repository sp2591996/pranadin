"use client";

/** Sounds tab (D-026): recordings, sounds made on the device, scenes, sleep timer, and the japa mala. */
import { useEffect, useState, useSyncExternalStore } from "react";
import { Mandala } from "@/components/Mandala";
import { useS, type S } from "@/features/shared/strings";
import { btn, card } from "@/features/shared/ui";
import { trackById, tracksIn, usedCategories, type AudioTrack } from "@/lib/audio-manifest";
import { soundEngine } from "./engine";
import { JapaMala } from "./JapaMala";
import { GENERATED, isGenerated, SCENES, SLEEP_OPTIONS, type Layer } from "./scenes";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";

/** Translated name, or the manifest's English name when no string exists for a new file. */
export function trackName(s: S, t: AudioTrack): string {
  const key = `sounds.track.${t.id}`;
  const v = s(key);
  return v === key ? t.name : v;
}

function soundName(s: S, id: string): string {
  if (isGenerated(id)) return s(`sounds.gen.${id}`);
  const t = trackById(id);
  return t ? trackName(s, t) : id;
}

function keyName(s: S, key: string): string {
  const [kind, id = ""] = key.split(":");
  return kind === "scene" ? s(`sounds.scene.${id}`) : soundName(s, id);
}

function fmt(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

const useSnap = () => useSyncExternalStore(soundEngine.subscribe, soundEngine.getSnapshot, soundEngine.getServerSnapshot);

/** "Album art" colours for sound tiles (D-036). */
const ART = ["from-[#E08A2C] to-[#9C3A12]", "from-[#2F7D74] to-[#163F45]", "from-[#4A3A7A] to-[#1F1638]", "from-[#2F6B3F] to-[#173621]", "from-[#7A2F5A] to-[#3A1229]", "from-[#2D4F86] to-[#15284A]"];

function PlayRow({ id, name, sub, layers }: { id: string; name: string; sub?: string; layers: readonly Layer[] }) {
  const s = useS();
  const snap = useSnap();
  const key = `sound:${id}`;
  const on = snap.key === key && snap.status !== "idle";
  return (
    <li className={`card-lift flex flex-wrap items-center gap-3 rounded-2xl border p-4 shadow-elev-1 transition-colors ${on ? "border-[color-mix(in_srgb,var(--primary)_40%,var(--divider))] bg-primary-tint/40" : "border-divider bg-surface"}`}>
      <span aria-hidden="true" className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-[#FFF4DE] shadow-md ${ART[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % ART.length]}`}>
        {on ? (
          <span className="eq">
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : (
          <Icon name="Waveform" size={24} />
        )}
      </span>
      <span className="min-w-0 flex-1 basis-32">
        <span className="block font-display text-[1.25rem] font-semibold leading-tight [overflow-wrap:anywhere]">{name}</span>
        {sub ? <span className="block text-small text-text-muted">{sub}</span> : null}
      </span>
      <button
        type="button"
        aria-pressed={on}
        aria-label={on ? s("sounds.stopName", { name }) : s("sounds.playName", { name })}
        className={on ? btn.primary : btn.secondary}
        style={{ minWidth: 96 }}
        onClick={() => (on ? soundEngine.stop() : void soundEngine.play(key, layers))}
      >
        {on ? s("sounds.stop") : s("sounds.play")}
      </button>
    </li>
  );
}

function SleepLeft({ endsAt }: { endsAt: number }) {
  const s = useS();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <p className="text-text-muted" data-testid="sleep-left">
      {s("sounds.sleep.left", { time: fmt(endsAt - now) })}
    </p>
  );
}

function NowPlaying() {
  const s = useS();
  const snap = useSnap();
  const active = snap.key !== null;
  const name = snap.key ? keyName(s, snap.key) : "";
  return (
    <section aria-labelledby="now-h" className={`${card} flex flex-col gap-4`} data-testid="now-playing">
      <div className="flex items-center gap-3">
        <Mandala className="size-12 shrink-0 text-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          <h2 id="now-h" className="text-h3">
            {s("sounds.now.title")}
          </h2>
          <p role="status" aria-live="polite" className="text-text-muted [overflow-wrap:anywhere]" data-testid="now-status">
            {!active
              ? s("sounds.now.idle")
              : snap.status === "loading"
                ? s("sounds.now.loading", { name })
                : snap.status === "error"
                  ? s("sounds.now.error")
                  : name}
          </p>
        </div>
        {active ? (
          <button type="button" className={btn.primary} onClick={() => soundEngine.stop()}>
            {s("sounds.stop")}
          </button>
        ) : null}
      </div>

      {active && snap.layers.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {snap.layers.map((l) => (
            <li key={l.id} className="flex flex-col gap-1">
              <label htmlFor={`vol-${l.id}`} className="text-[0.875rem] leading-5 text-text-muted">
                {s("sounds.volumeOf", { name: soundName(s, l.id) })}
              </label>
              <input
                id={`vol-${l.id}`}
                type="range"
                min={0}
                max={100}
                value={Math.round(l.volume * 100)}
                onChange={(e) => soundEngine.setLayerVolume(l.id, Number(e.target.value) / 100)}
                className="h-11 w-full accent-[var(--accent)]"
              />
            </li>
          ))}
        </ul>
      ) : null}

      <div role="group" aria-labelledby="sleep-h" className="flex flex-col gap-2">
        <h3 id="sleep-h" className="font-semibold">
          {s("sounds.sleep.title")}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn.chip} aria-pressed={snap.sleepMinutes === null} onClick={() => soundEngine.setSleep(null)}>
            {s("sounds.sleep.off")}
          </button>
          {SLEEP_OPTIONS.map((m) => (
            <button key={m} type="button" className={btn.chip} aria-pressed={snap.sleepMinutes === m} onClick={() => soundEngine.setSleep(m)}>
              {s("sounds.sleep.min", { n: m })}
            </button>
          ))}
        </div>
        {snap.sleepEndsAt !== null ? (
          <SleepLeft key={snap.sleepEndsAt} endsAt={snap.sleepEndsAt} />
        ) : null}
      </div>
    </section>
  );
}

function Listen() {
  const s = useS();
  const snap = useSnap();
  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto w-full max-w-3xl">
        <NowPlaying />
      </div>

      <section aria-labelledby="scenes-h">
        <h2 id="scenes-h" className="text-[1.75rem] leading-9">{s("sounds.scenes.title")}</h2>
        <p className="mb-4 text-text-muted">{s("sounds.scenes.sub")}</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SCENES.map((sc) => {
            const key = `scene:${sc.id}`;
            const on = snap.key === key && snap.status !== "idle";
            const name = s(`sounds.scene.${sc.id}`);
            return (
              <li key={sc.id} className={`card-lift flex flex-wrap items-center gap-3 rounded-2xl border p-4 shadow-elev-1 transition-colors ${on ? "border-[color-mix(in_srgb,var(--primary)_40%,var(--divider))] bg-primary-tint/40" : "border-divider bg-surface"}`}>
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))] text-accent">
                  <Icon name="FlowerLotus" size={22} />
                </span>
                <span className="min-w-0 flex-1 basis-32">
                  <span className="block font-display text-[1.25rem] font-semibold leading-tight [overflow-wrap:anywhere]">{name}</span>
                  <span className="block text-small text-text-muted [overflow-wrap:anywhere]">
                    {sc.layers.map((l) => soundName(s, l.id)).join(" · ")}
                  </span>
                </span>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={on ? s("sounds.stopName", { name }) : s("sounds.playName", { name })}
                  className={on ? btn.primary : btn.secondary}
                  style={{ minWidth: 96 }}
                  onClick={() => (on ? soundEngine.stop() : void soundEngine.play(key, sc.layers))}
                >
                  {on ? s("sounds.stop") : s("sounds.play")}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="rec-h">
        <h2 id="rec-h" className="mb-3 text-[1.75rem] leading-9">
          {s("sounds.rec.title")}
        </h2>
        <div className="flex flex-col gap-4">
          {usedCategories().map((c) => (
            <div key={c}>
              <h3 className="eyebrow mb-3 !tracking-wider text-primary">{s(`sounds.rec.${c}`)}</h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tracksIn(c).map((t) => (
                  <PlayRow
                    key={t.id}
                    id={t.id}
                    name={trackName(s, t)}
                    sub={t.ai ? s("sounds.aiVoice") : undefined}
                    layers={[{ id: t.id, volume: 0.8 }]}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="gen-h">
        <h2 id="gen-h" className="text-[1.75rem] leading-9">{s("sounds.gen.title")}</h2>
        <p className="mb-4 text-text-muted">{s("sounds.gen.sub")}</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GENERATED.map((id) => (
            <PlayRow
              key={id}
              id={id}
              name={s(`sounds.gen.${id}`)}
              sub={id === "soham" ? s("sounds.gen.soham.sub") : undefined}
              layers={[{ id, volume: 0.7 }]}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Segmented control (after the reference prototype's tab switchers). */
const seg = "inline-flex min-h-11 items-center rounded-full px-5 font-semibold text-text-muted transition-colors aria-[pressed=true]:bg-surface aria-[pressed=true]:text-primary aria-[pressed=true]:shadow-elev-1";

export function SoundsView() {
  const s = useS();
  const [view, setView] = useState<"listen" | "japa">("listen");
  return (
    <div className="wide flex flex-col gap-6">
      <PageHero as="div" deva="नाद · जप" title={s("sounds.title")} intro={s("sounds.intro")} />
      <div role="group" aria-label={s("sounds.view.label")} className="mx-auto flex flex-wrap justify-center gap-1 rounded-full border border-divider bg-surface-2 p-1">
        <button type="button" className={seg} aria-pressed={view === "listen"} onClick={() => setView("listen")}>
          {s("sounds.view.listen")}
        </button>
        <button type="button" className={seg} aria-pressed={view === "japa"} onClick={() => setView("japa")}>
          {s("sounds.view.japa")}
        </button>
      </div>
      {view === "listen" ? (
        <Listen />
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <JapaMala />
          <NowPlaying />
        </div>
      )}
    </div>
  );
}
