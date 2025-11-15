import { useState, useMemo } from "react";
import type { Monster } from "./MonsterView";
import MonsterView from "./MonsterView";

export default function StatBlockViewer() {
  // Import all JSON files eagerly
  const monsterFiles = import.meta.glob("./StatBlocks/*.json", { eager: true }) as unknown as Record<
    string,
    { default: Monster }
  >;

  const monsters: Monster[] = Object.values(monsterFiles).map((m) => m.default);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Monster | null>(null);
  const [filterSize, setFilterSize] = useState<string>("All");
  const [filterCR, setFilterCR] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterAlignment, setFilterAlignment] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return monsters.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.type.toLowerCase().includes(search.toLowerCase()) ||
        (m.alignment?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesSize = filterSize === "All" || m.size === filterSize;
      const matchesCR =
        filterCR === "All" || (m.challengeRating !== undefined && m.challengeRating.toString() === filterCR);
      const matchesType = filterType === "All" || m.type === filterType;
      const matchesAlignment = filterAlignment === "All" || m.alignment === filterAlignment;

      return matchesSearch && matchesSize && matchesCR && matchesType && matchesAlignment;
    });
  }, [search, filterSize, filterCR, filterType, filterAlignment, monsters]);

  const uniqueValues = (key: keyof Monster) =>
    Array.from(new Set(monsters.map((m) => m[key]).filter(Boolean))) as string[];

  const uniqueCRs = Array.from(
    new Set(
      monsters
        .map((m) => (m.challengeRating !== undefined ? m.challengeRating.toString() : null))
        .filter(Boolean)
    )
  ).sort((a, b) => Number(a) - Number(b));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", gap: 10, padding: 10 }}>
      {/* TOP BAR */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          padding: "6px 10px",
          borderRadius: 6,
          background: "#f5f5f5",
          border: "1px solid #ccc",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Monster Select */}
        <select
          value={selected?.name || ""}
          onChange={(e) => {
            const m = monsters.find((m) => m.name === e.target.value);
            setSelected(m ?? null);
          }}
          style={{ padding: "6px 8px", borderRadius: 4, minWidth: 180 }}
        >
          <option value="">Select Monster</option>
          {filtered.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, type, alignment"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 4, flex: 1, minWidth: 200 }}
        />

        {/* Toggle Filters */}
        <button
          style={{ padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* FILTERS ROW */}
      {showFilters && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            padding: "6px 10px",
            borderRadius: 6,
            background: "#fafafa",
            border: "1px solid #ddd",
          }}
        >
          <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)}>
            <option value="All">All Sizes</option>
            {uniqueValues("size").map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select value={filterCR} onChange={(e) => setFilterCR(e.target.value)}>
            <option value="All">All CRs</option>
            {uniqueCRs.map((cr) => (
              <option key={cr ?? ""} value={cr ?? ""}>
                {cr}
              </option>
            ))}
          </select>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="All">All Types</option>
            {uniqueValues("type").map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select value={filterAlignment} onChange={(e) => setFilterAlignment(e.target.value)}>
            <option value="All">All Alignments</option>
            {uniqueValues("alignment").map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 10,
          width: "100%",
        }}
      >
        {selected ? (
          <>
            {/* Statblock */}
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <MonsterView monster={selected} />
            </div>

            {/* Image below statblock */}
            {selected.imageUrl && (
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <img
                  src={selected.imageUrl}
                  alt={selected.name}
                  style={{ maxWidth: "100%", height: "auto", borderRadius: 4 }}
                />
              </div>
            )}
          </>
        ) : (
          <p>Select a monster from the dropdown above.</p>
        )}
      </div>
    </div>
  );
}
