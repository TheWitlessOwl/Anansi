import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Eye, EyeOff } from "lucide-react";
import tooltipsDataJson from "../../Data/Tooltips.json";

interface Ability {
  score: number;
  mod: number;
  save: number;
  tooltip?: string;
}

interface TraitOrAction {
  name?: string;
  desc: string;
}

export interface Monster {
  name: string;
  size?: string;
  type: string;
  tags?: string[];
  alignment?: string;
  armorClass?: number;
  hitPoints?: number;
  hitDice?: string;
  initiative?: number;
  initiativeAverage?: number;
  speed?: Record<string, number | null>;
  abilities?: Record<string, Ability>;
  skills?: Record<string, number>;
  resistances?: string[];
  immunities?: string[];
  gear?: string[];
  senses?: string[];
  languages?: string[];
  challengeRating: number;
  xp?: number;
  lairXp?: number;
  traits: TraitOrAction[];
  actions: TraitOrAction[];
  bonusActions: TraitOrAction[];
  reactions: TraitOrAction[];
  legendaryActions: TraitOrAction[];
  legendarySubtitle?: string;
  image?: string;
  [key: string]: any;
}

const tooltipsData: Record<string, string> = tooltipsDataJson;

const CR_XP_2024: Record<number, number> = {
  0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100,
  5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900, 11: 7200, 12: 8400,
  13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000,
  20: 25000, 21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000, 26: 90000,
  27: 105000, 28: 120000, 29: 135000, 30: 155000
};

const fmt = (n?: number) => (n !== undefined ? n.toLocaleString() : "N/A");
const formatSigned = (n: number) => (n >= 0 ? `+${n}` : n.toString());
const formatCR = (cr?: number) => {
  const frac: Record<string, string> = { "0.125": "1/8", "0.25": "1/4", "0.5": "1/2" };
  return frac[String(cr)] ?? cr?.toString() ?? "N/A";
};

function renderWithTooltips(desc: string) {
  if (!desc) return null;
  const words = Object.keys(tooltipsData).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return <ReactMarkdown>{desc}</ReactMarkdown>;
  const regex = new RegExp(`\\b(${words.join("|")})\\b`, "gi");
  const replaced = desc.replace(regex, (match) => {
    const tip = tooltipsData[match];
    return tip
      ? `<span title="${tip}" style="text-decoration:underline dotted;cursor:help;">${match}</span>`
      : match;
  });
  return <ReactMarkdown rehypePlugins={[rehypeRaw]} components={{ p: ({ ...props }) => <p style={{ margin: "2px 0" }} {...props} /> }}>{replaced}</ReactMarkdown>;
}

const renderTraits = (items?: TraitOrAction[]) =>
  items && items.length
    ? items.map((t, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          {t.name && <div style={{ fontWeight: "bold" }}>{renderWithTooltips(t.name)}</div>}
          <div>{renderWithTooltips(t.desc)}</div>
        </div>
      ))
    : "None";

const renderAbilities = (abilities?: Record<string, Ability>) => {
  if (!abilities) return null;
  const cols = ["str", "dex", "con", "int", "wis", "cha"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginTop: 4 }}>
      {cols.map((key) => {
        const ab = abilities[key];
        if (!ab) return null;
        return (
          <div
            key={key}
            style={{
              border: "1px solid #999",
              borderRadius: 4,
              padding: 4,
              fontSize: "1em",
              textAlign: "center",
              background: "#f7f7f7",
            }}
          >
            <div style={{ fontWeight: "bold" }}>{key.toUpperCase()}</div>
            <div>{ab.score} ({formatSigned(ab.mod)})</div>
            <div>Save: {formatSigned(ab.save)}</div>
          </div>
        );
      })}
    </div>
  );
};

const Section = ({ title, visible, toggle, children }: any) => (
  <div style={{ marginTop: 4 }}>
    <div style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 4, fontWeight: "bold" }} onClick={toggle}>
      <span>{title}</span>
      {visible ? <Eye size={14} /> : <EyeOff size={14} />}
    </div>
    <div style={{ height: 1, backgroundColor: "#999", margin: "2px 0 2px" }} />
    {visible && <div>{children}</div>}
  </div>
);

export default function MonsterView({ monster }: { monster: Monster }) {
  const [showTraits, setShowTraits] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [showBonus, setShowBonus] = useState(true);
  const [showReactions, setShowReactions] = useState(true);
  const [showLegendary, setShowLegendary] = useState(true);

  const calculatedXP = CR_XP_2024[monster.challengeRating] ?? 0;
  const finalXP = monster.xp ?? calculatedXP;
  const xpDisplay = fmt(finalXP);
  const lairXpDisplay = fmt(monster.lairXp);

  const renderList = (items?: string[]) => (items && items.length ? items.join(", ") : "None");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        border: "2px solid #333",
        borderRadius: 8,
        padding: 8,
        width: "99%",
        fontSize: "0.75em",
        lineHeight: 1.2,
        background: "#fff",
      }}
    >
      {/* Monster Image */}
      {monster.image && (
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <img
            src={monster.image}
            alt={monster.name}
            style={{ maxWidth: "100%", height: "auto", borderRadius: 4 }}
          />
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: 12, width: "100%" }}>
        {/* Left column */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: "1.2em" }}>{monster.name}</h2>
          <div style={{ fontSize: "0.8em", opacity: 0.8 }}>
            {monster.size ? `${monster.size} ` : ""}{monster.type}{monster.tags ? ` • ${monster.tags.join(", ")}` : ""}{monster.alignment ? ` • ${monster.alignment}` : ""}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
            <div><strong>AC:</strong> {monster.armorClass ?? "N/A"}</div>
            <div><strong>HP:</strong> {monster.hitPoints ?? "N/A"} {monster.hitDice && `(${monster.hitDice})`}</div>
            {monster.initiative !== undefined && <div><strong>Init:</strong> +{monster.initiative}{monster.initiativeAverage !== undefined && ` (${monster.initiativeAverage})`}</div>}
          </div>

          {/* CR & XP */}
          <div style={{ marginTop: 2 }}>
            <strong>CR:</strong> {formatCR(monster.challengeRating)} ({xpDisplay}{monster.lairXp !== undefined && ` / ${lairXpDisplay} in lair`})
          </div>

          {monster.speed && <div style={{ marginTop: 2 }}><strong>Speed:</strong>{" "}{Object.entries(monster.speed).filter(([,v]) => v!==null).map(([k,v]) => `${k} ${v} ft.`).join(", ")}</div>}

          {renderAbilities(monster.abilities)}

          <div style={{ marginTop: 4 }}>
            {monster.skills && <div><strong>Skills:</strong> {renderList(Object.entries(monster.skills).map(([k,v]) => `${k} +${v}`))}</div>}
            {monster.senses && <div><strong>Senses:</strong> {renderList(monster.senses)}</div>}
            {monster.languages && <div><strong>Languages:</strong> {renderList(monster.languages)}</div>}
            {monster.immunities && <div><strong>Immunities:</strong> {renderList(monster.immunities)}</div>}
          </div>

          {monster.traits?.length > 0 && <Section title="Traits" visible={showTraits} toggle={() => setShowTraits(!showTraits)}>{renderTraits(monster.traits)}</Section>}
          {monster.actions?.length > 0 && <Section title="Actions" visible={showActions} toggle={() => setShowActions(!showActions)}>{renderTraits(monster.actions)}</Section>}
        </div>

        {/* Right column */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 4 }}>
          {monster.bonusActions?.length > 0 && <Section title="Bonus Actions" visible={showBonus} toggle={() => setShowBonus(!showBonus)}>{renderTraits(monster.bonusActions)}</Section>}
          {monster.reactions?.length > 0 && <Section title="Reactions" visible={showReactions} toggle={() => setShowReactions(!showReactions)}>{renderTraits(monster.reactions)}</Section>}
          {monster.legendaryActions?.length > 0 && <Section title="Legendary Actions" visible={showLegendary} toggle={() => setShowLegendary(!showLegendary)}>
            {monster.legendarySubtitle && <div style={{ fontStyle: "italic", marginBottom: 4 }}>{monster.legendarySubtitle}</div>}
            {monster.legendaryActions.map((act, i) => <div key={i} style={{ marginBottom: 4 }}>{act.name && <div style={{ fontWeight: "bold" }}>{renderWithTooltips(act.name)}</div>}<div>{renderWithTooltips(act.desc)}</div></div>)}
          </Section>}
        </div>
      </div>
    </div>
  );
}
