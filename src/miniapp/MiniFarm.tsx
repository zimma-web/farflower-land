import { useEffect, useMemo, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

type Crop = "sunflower" | "carrot";
type Plot = { crop?: Crop; plantedAt?: number };
type Save = { coins: number; xp: number; plots: Plot[] };

const SAVE_KEY = "sunny-garden-miniapp-v1";
const GROW_MS = 30_000;
const cropCopy: Record<Crop, { label: string; seed: string; ready: string }> = {
  sunflower: { label: "Sunflower", seed: "/mini-assets/sunflower_00.png", ready: "/mini-assets/sunflower_05.png" },
  carrot: { label: "Carrot", seed: "/mini-assets/carrot_00.png", ready: "/mini-assets/carrot_05.png" },
};

const freshSave = (): Save => ({ coins: 24, xp: 0, plots: Array.from({ length: 9 }, () => ({})) });

function readSave(): Save {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "") as Save;
    if (Array.isArray(parsed.plots) && parsed.plots.length === 9) return parsed;
  } catch {
    // A corrupt local save should never block the mini app from opening.
  }
  return freshSave();
}

function stage(plot: Plot, now: number) {
  if (!plot.crop || !plot.plantedAt) return "empty" as const;
  const progress = Math.min(1, (now - plot.plantedAt) / GROW_MS);
  return progress >= 1 ? "ready" as const : progress > 0.45 ? "growing" as const : "seed" as const;
}

export function MiniFarm() {
  const [save, setSave] = useState<Save>(readSave);
  const [selected, setSelected] = useState<Crop>("sunflower");
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState("Tap an empty plot to plant.");

  useEffect(() => {
    void sdk.actions.ready().catch(() => undefined);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => localStorage.setItem(SAVE_KEY, JSON.stringify(save)), [save]);

  const readyCount = useMemo(
    () => save.plots.filter((plot) => stage(plot, now) === "ready").length,
    [save.plots, now],
  );

  const tapPlot = (index: number) => {
    const plot = save.plots[index];
    const state = stage(plot, now);
    if (state === "ready" && plot.crop) {
      const reward = plot.crop === "sunflower" ? 8 : 12;
      setSave((current) => ({
        ...current,
        coins: current.coins + reward,
        xp: current.xp + 5,
        plots: current.plots.map((item, position) => position === index ? {} : item),
      }));
      setNotice(`Harvested ${cropCopy[plot.crop].label}! +${reward} seeds`);
      return;
    }
    if (state !== "empty") {
      setNotice("Still growing — come back in a moment.");
      return;
    }
    if (save.coins < 2) {
      setNotice("You need 2 seeds to plant.");
      return;
    }
    setSave((current) => ({
      ...current,
      coins: current.coins - 2,
      plots: current.plots.map((item, position) => position === index ? { crop: selected, plantedAt: Date.now() } : item),
    }));
    setNotice(`${cropCopy[selected].label} planted. It will be ready in 30 seconds.`);
  };

  const share = async () => {
    const text = `I harvested ${save.xp} crops in Sunny Garden. Can you grow more?`;
    try {
      if (navigator.share) await navigator.share({ title: "Sunny Garden", text });
      else await navigator.clipboard.writeText(text);
      setNotice("Challenge copied/shared — invite your friends!");
    } catch {
      // The share sheet may be dismissed by the player; nothing else is needed.
    }
  };

  return (
    <main className="mini-farm">
      <header className="topbar">
        <div><p className="eyebrow">FARCASTER MINI APP</p><h1>Farflower Land</h1></div>
        <div className="level">LVL {1 + Math.floor(save.xp / 25)}</div>
      </header>
      <section className="stats" aria-label="Garden status">
        <span>🌻 {save.coins} seeds</span><span>✨ {save.xp} XP</span><span>🧺 {readyCount} ready</span>
      </section>
      <section className="farm-card" aria-label="Your garden">
        <div className="cloud cloud-one" /><div className="cloud cloud-two" />
        <div className="farm-title"><span>YOUR LITTLE FARM</span><small>{notice}</small></div>
        <div className="plots">
          {save.plots.map((plot, index) => {
            const plotStage = stage(plot, now);
            const image = plot.crop ? (plotStage === "ready" ? cropCopy[plot.crop].ready : plotStage === "growing" ? plot.crop === "sunflower" ? "/mini-assets/sunflower_02.png" : "/mini-assets/carrot_03.png" : cropCopy[plot.crop].seed) : undefined;
            return <button className={`plot ${plotStage}`} key={index} onClick={() => tapPlot(index)} aria-label={`Plot ${index + 1}, ${plotStage}`}>
              <img className="soil" src="/mini-assets/soil_03.png" alt="" />
              {image && <img className="crop" src={image} alt="" />}
              {plotStage === "ready" && <b>HARVEST</b>}
            </button>;
          })}
        </div>
      </section>
      <section className="seed-picker" aria-label="Choose a crop">
        {(Object.keys(cropCopy) as Crop[]).map((crop) => <button key={crop} className={selected === crop ? "selected" : ""} onClick={() => setSelected(crop)}>
          <img src={cropCopy[crop].seed} alt="" /> <span>{cropCopy[crop].label}</span><small>2 seeds</small>
        </button>)}
      </section>
      <button className="share" onClick={share}>Share your garden ↗</button>
    </main>
  );
}
