import { useState, useEffect } from "react";

interface Stats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface SavingThrows {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface Passives {
  perception: number;
  investigation: number;
  insight: number;
}

export interface CharacterSheet {
  name: string;
  playerName: string;
  species: string;
  class: string;
  party: string;
  level: number;
  currentHP: number;
  maxHP: number;
  ac: number;
  initiative: number;
  proficiency: number;
  stats: Stats;
  savingThrows: SavingThrows;
  passives: Passives;
  xp: number;
  imageUrl?: string;
  filename?: string;
}

const storageAPI = {
  saveCharacter: async (filename: string, data: any) => {
    localStorage.setItem(filename, JSON.stringify(data));
  },
  loadCharacter: async (filename: string) => {
    const raw = localStorage.getItem(filename);
    return raw ? JSON.parse(raw) : null;
  },
  listCharacters: async () => {
    return Object.keys(localStorage).filter((k) => k.endsWith('.json'));
  },
  deleteCharacter: async (filename: string) => {
    localStorage.removeItem(filename);
    return true;
  },
};

const xpThresholds = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000,
  305000, 355000
];

export default function CharacterSheets() {
  const [characters, setCharacters] = useState<CharacterSheet[]>([]);
  const [selectedCharacterFilename, setSelectedCharacterFilename] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  const [filterParty, setFilterParty] = useState("All");

  const emptyCharacter: CharacterSheet = {
    name: "",
    playerName: "",
    species: "",
    class: "",
    party: "",
    level: 1,
    currentHP: 10,
    maxHP: 10,
    ac: 10,
    initiative: 0,
    proficiency: 2,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    passives: { perception: 10, investigation: 10, insight: 10 },
    xp: 0,
    imageUrl: "",
  };

  const calculateLevel = (totalXP: number) => {
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
      if (totalXP >= xpThresholds[i]) return i + 1;
    }
    return 1;
  };

  // Save all characters to localStorage for PartyTracker sync
  const saveAllCharacters = (chars: CharacterSheet[]) => {
    localStorage.setItem("characterSheets_all", JSON.stringify(chars));
  };

  const loadAllCharacters = async () => {
    try {
      const files = await storageAPI.listCharacters();
      const loaded: CharacterSheet[] = [];
      for (const f of files) {
        const data = await storageAPI.loadCharacter(f);
        if (data) loaded.push({ ...data, filename: f });
      }
      
      console.log('Reloaded characters:', loaded);
      setCharacters(loaded);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAllCharacters();
    
    // Listen for custom event from PartyTracker
    const handleCharacterUpdate = () => {
      console.log('Character update event received, reloading...');
      // Force reload after a small delay to ensure localStorage is written
      setTimeout(() => {
        loadAllCharacters();
      }, 100);
    };
    
    window.addEventListener('characterSheetsUpdated', handleCharacterUpdate);
    
    // Listen for storage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "characterSheets_all") {
        console.log('Storage change detected, reloading characters...');
        loadAllCharacters();
      }
    };
    
    window.addEventListener("storage", handleStorage);
    
    return () => {
      window.removeEventListener('characterSheetsUpdated', handleCharacterUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Sync all characters whenever they change
  useEffect(() => {
    saveAllCharacters(characters);
  }, [characters]);

  const addCharacter = async () => {
    const filename = `Unnamed_${Date.now()}.json`;
    const newChar: CharacterSheet = { ...emptyCharacter, filename };
    await storageAPI.saveCharacter(filename, newChar);
    setCharacters((prev) => [...prev, newChar]);
    setSelectedCharacterFilename(newChar.filename || null);
    setEditMode(false);
  };

  const deleteCurrent = async () => {
    if (!current) return;
    if (current.filename) await storageAPI.deleteCharacter(current.filename);
    setCharacters(prev => prev.filter(c => c.filename !== current.filename));
    setSelectedCharacterFilename(null);
  };

  const updateField = <K extends keyof CharacterSheet>(key: K, value: CharacterSheet[K]) => {
    if (!current) return;
    setCharacters(prev => {
      const updated = prev.map(c =>
        c.filename === current.filename ? { ...c, [key]: value } : c
      );
      const updatedChar = updated.find(c => c.filename === current.filename);
      if (current.filename && updatedChar) {
        storageAPI.saveCharacter(current.filename, updatedChar);
      }
      return updated;
    });
  };

  const updateNested = <T extends "stats" | "savingThrows" | "passives", K extends keyof CharacterSheet[T]>(
    section: T,
    key: K,
    value: CharacterSheet[T][K]
  ) => {
    if (!current) return;
    setCharacters(prev => {
      const updated = prev.map(c =>
        c.filename === current.filename
          ? { ...c, [section]: { ...c[section], [key]: value } }
          : c
      );
      const updatedChar = updated.find(c => c.filename === current.filename);
      if (current.filename && updatedChar) {
        storageAPI.saveCharacter(current.filename, updatedChar);
      }
      return updated;
    });
  };

  const updateXP = (xp: number) => {
    if (!current) return;
    setCharacters(prev => {
      const updated = prev.map(c => {
        if (c.filename !== current.filename) return c;
        const newXP = Math.max(0, xp);
        return { ...c, xp: newXP, level: calculateLevel(newXP) };
      });
      const updatedChar = updated.find(c => c.filename === current.filename);
      if (current.filename && updatedChar) {
        storageAPI.saveCharacter(current.filename, updatedChar);
      }
      return updated;
    });
  };

  const updateLevel = (level: number) => {
    if (!current) return;
    const lvl = Math.max(1, Math.min(level, xpThresholds.length));
    const newXP = xpThresholds[lvl - 1];
    setCharacters(prev => {
      const updated = prev.map(c =>
        c.filename === current.filename ? { ...c, level: lvl, xp: newXP } : c
      );
      const updatedChar = updated.find(c => c.filename === current.filename);
      if (current.filename && updatedChar) {
        storageAPI.saveCharacter(current.filename, updatedChar);
      }
      return updated;
    });
  };

  const exportCurrent = () => {
    if (!current) {
      alert("Please select a character first!");
      return;
    }
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${current.name || "Unnamed"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const filename = `Imported_${Date.now()}.json`;
        const newChar: CharacterSheet = { ...emptyCharacter, ...data, filename };
        await storageAPI.saveCharacter(filename, newChar);
        setCharacters(prev => [...prev, newChar]);
        setSelectedCharacterFilename(newChar.filename || null);
        setEditMode(false);
      } catch (err) {
        alert("Invalid JSON file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const current = characters.find(c => c.filename === selectedCharacterFilename) || null;
  const formatModifier = (v: number) => (v >= 0 ? `+${v}` : v.toString());

  const filteredCharacters = characters.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.species.toLowerCase().includes(search.toLowerCase()) ||
      c.party.toLowerCase().includes(search.toLowerCase());
    const matchesSpecies = filterSpecies === "All" || c.species === filterSpecies;
    const matchesLevel = filterLevel === "All" || c.level.toString() === filterLevel;
    const matchesParty = filterParty === "All" || c.party === filterParty;
    return matchesSearch && matchesSpecies && matchesLevel && matchesParty;
  });

  // --- Styles ---
  const sheetStyle: React.CSSProperties = { width: "100%", minWidth: 200, maxWidth: 600, margin: "0 auto", padding: 20, border: "2px solid #333", borderRadius: 8, background: "#fafafa", boxShadow: "0 2px 8px rgba(0,0,0,0.1)"};
  const rowStyle: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center"};
  const columnStyle: React.CSSProperties = { flex: "1 1 45%", minWidth: 120, textAlign: "center" };
  const statColumnStyle: React.CSSProperties = { flex: "1 1 30%", minWidth: 80, textAlign: "center" };
  const labelStyle: React.CSSProperties = { fontWeight: "bold" };
  const inputStyleText: React.CSSProperties = { padding: 6, border: "1px solid #ccc", borderRadius: 4, width: "100%" };
  const inputStyleNumber: React.CSSProperties = { padding: 4, border: "1px solid #ccc", borderRadius: 4, width: 60, textAlign: "center" };
  const sectionHeaderStyle: React.CSSProperties = { fontWeight: "bold", fontSize: 16, borderBottom: "1px solid #aaa", marginBottom: 6, paddingBottom: 4, textAlign: "center" };
  const buttonStyle: React.CSSProperties = { padding: "6px 12px", borderRadius: 4, border: "1px solid #333", cursor: "pointer", background: "#f0f0f0", textAlign: "center", fontFamily: "inherit", fontSize: "inherit" };
  const redButtonStyle: React.CSSProperties = { ...buttonStyle, background: "#ff4d4f", color: "#fff", border: "1px solid #ff0000" };
  const rowSingleLine: React.CSSProperties = {display: "flex", gap: 10, justifyContent: "center", flexWrap: "nowrap"};

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", boxSizing: "border-box" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "#fafafa", borderBottom: "2px solid #333", flexWrap: "wrap" }}>
        <select
          value={selectedCharacterFilename || ""}
          onChange={(e) => setSelectedCharacterFilename(e.target.value)}
          style={{ padding: 6, borderRadius: 4 }}
        >
          <option value="">Select Character</option>
          {filteredCharacters.map(c => (
            <option key={c.filename} value={c.filename}>{c.name || "Unnamed"}</option>
          ))}
        </select>

        {/* Filters */}
        <button style={buttonStyle} onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
        {showFilters && (
          <>
            <input type="text" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }} />
            <select value={filterSpecies} onChange={(e) => setFilterSpecies(e.target.value)} style={{ padding: 6, borderRadius: 4 }}>
              <option value="All">All Species</option>
              {Array.from(new Set(characters.map((c) => c.species).filter(Boolean))).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={{ padding: 6, borderRadius: 4 }}>
              <option value="All">All Levels</option>
              {Array.from(new Set(characters.map((c) => c.level))).sort((a,b)=>a-b).map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} style={{ padding: 6, borderRadius: 4 }}>
              <option value="All">All Parties</option>
              {Array.from(new Set(characters.map((c) => c.party).filter(Boolean))).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </>
        )}

        <button onClick={addCharacter} style={buttonStyle}>Add</button>
        <button onClick={exportCurrent} style={buttonStyle}>Export</button>
        <label htmlFor="import-file" style={buttonStyle}>
          Import
        </label>
        <input 
          id="import-file"
          type="file" 
          accept=".json" 
          style={{ display: "none" }} 
          onChange={handleImport} 
        />
      </div>

      {/* Main Columns */}
      <div style={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {/* Left: Character Sheet */}
        <div style={{ flex: 1, padding: 10, overflow: "auto", fontSize: "clamp(10px, 1.15vw, 16px)", lineHeight: 1.15 }}>
          <div style={sheetStyle}>
            {!current && <h2>No character selected</h2>}
            {current && (
              <>
                {/* Edit/Delete */}
                <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 10 }}>
                  <button onClick={() => setEditMode(!editMode)} style={buttonStyle}>{editMode ? "Lock" : "Edit"}</button>
                  {editMode && <button onClick={deleteCurrent} style={redButtonStyle}>Delete</button>}
                </div>

                {/* Name */}
                <div style={{ marginBottom: 10, textAlign: "center" }}>
                  {editMode ? <input style={inputStyleText} value={current.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Name" /> : <h2>{current.name}</h2>}
                </div>

                {/* Species/Class */}
                <div style={{ display: "flex", gap: 10, marginBottom: 6, textAlign:"center" }}>
                  {editMode ? (
                    <>
                      <input style={{ ...inputStyleText, flex: 1 }} value={current.species} onChange={(e) => updateField("species", e.target.value)} placeholder="Species" />
                      <input style={{ ...inputStyleText, flex: 1 }} value={current.class} onChange={(e) => updateField("class", e.target.value)} placeholder="Class" />
                    </>
                  ) : (
                    <div style={{ fontStyle: "italic", width: "100%" }}>{current.species}, {current.class}</div>
                  )}
                </div>

                {/* Party/Player */}
                <div style={{ display: "flex", gap: 10, marginBottom: 10, textAlign:"center" }}>
                  {editMode ? (
                    <>
                      <input style={{ ...inputStyleText, flex: 1 }} value={current.party} onChange={(e) => updateField("party", e.target.value)} placeholder="Party" />
                      <input style={{ ...inputStyleText, flex: 1 }} value={current.playerName} onChange={(e) => updateField("playerName", e.target.value)} placeholder="Player Name" />
                    </>
                  ) : (
                    <div style={{ fontStyle: "italic", width: "100%" }}>{current.party} – {current.playerName}</div>
                  )}
                </div>

                {/* Level + XP Section */}
                <div style={{ marginBottom: 10, textAlign: "center" }}>
                  {editMode ? (
                    <div style={{ display: "flex", justifyContent: "center", gap: 10, alignItems: "center" }}>
                      <label style={{ fontWeight: "bold" }}>Level</label>
                      <input
                        type="number"
                        style={inputStyleNumber}
                        value={current.level}
                        onChange={(e) => updateLevel(Number(e.target.value))}
                      />
                      <label style={{ fontWeight: "bold" }}>XP</label>
                      <input
                        type="number"
                        style={{ ...inputStyleNumber, fontStyle: "italic" }}
                        value={current.xp}
                        onChange={(e) => updateXP(Number(e.target.value))}
                      />
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontWeight: "bold" }}>Level {current.level}</span>{" "}
                      (<span style={{ fontStyle: "italic" }}>{current.xp.toLocaleString()} xp</span>)
                    </div>
                  )}
                </div>

                {/* Stats Overview */}
                <div style={{ marginBottom: 10 }}>
                  <div style={sectionHeaderStyle}>Stats Overview</div>
                  <div style={rowStyle}>
                    <div style={columnStyle}>
                      <div style={labelStyle}>HP</div>
                      {editMode ? (
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <input type="number" style={inputStyleNumber} value={current.currentHP} onChange={(e) => updateField("currentHP", Number(e.target.value))} />
                          <input type="number" style={inputStyleNumber} value={current.maxHP} onChange={(e) => updateField("maxHP", Number(e.target.value))} />
                        </div>
                      ) : (
                        <div>{current.currentHP}/{current.maxHP}</div>
                      )}
                    </div>

                    <div style={columnStyle}>
                      <div style={labelStyle}>AC</div>
                      {editMode ? <input type="number" style={inputStyleNumber} value={current.ac} onChange={(e) => updateField("ac", Number(e.target.value))} /> : <div>{current.ac}</div>}
                    </div>

                    <div style={columnStyle}>
                      <div style={labelStyle}>Initiative</div>
                      {editMode ? <input type="number" style={inputStyleNumber} value={current.initiative} onChange={(e) => updateField("initiative", Number(e.target.value))} /> : <div>{formatModifier(current.initiative)}</div>}
                    </div>

                    <div style={columnStyle}>
                      <div style={labelStyle}>Proficiency</div>
                      {editMode ? <input type="number" style={inputStyleNumber} value={current.proficiency} onChange={(e) => updateField("proficiency", Number(e.target.value))} /> : <div>{formatModifier(current.proficiency)}</div>}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ marginBottom: 10 }}>
                  <div style={sectionHeaderStyle}>Stats</div>
                  <div style={rowStyle}>
                    {(["str","dex","con","int","wis","cha"] as const).map(k => (
                      <div style={statColumnStyle} key={k}>
                        <div style={labelStyle}>{k.toUpperCase()}</div>
                        {editMode ? (
                          <input type="number" style={inputStyleNumber} value={current.stats[k]} onChange={(e) => updateNested("stats", k, Number(e.target.value))} />
                        ) : (
                          <div>{current.stats[k]} ({formatModifier(Math.floor((current.stats[k]-10)/2))})</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saving Throws */}
                <div style={{ marginBottom: 10 }}>
                  <div style={sectionHeaderStyle}>Saving Throws</div>
                  <div style={rowStyle}>
                    {(["str","dex","con","int","wis","cha"] as const).map(k => (
                      <div style={statColumnStyle} key={k}>
                        <div style={labelStyle}>{k.toUpperCase()}</div>
                        {editMode ? (
                          <input type="number" style={inputStyleNumber} value={current.savingThrows[k]} onChange={(e) => updateNested("savingThrows", k, Number(e.target.value))} />
                        ) : (
                          <div>{formatModifier(current.savingThrows[k])}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={sectionHeaderStyle}>Passive Skills</div>
                  <div style={rowSingleLine}>
                    {(["perception","investigation","insight"] as const).map(k => (
                      <div style={statColumnStyle} key={k}>
                        <div style={labelStyle}>{k.charAt(0).toUpperCase()+k.slice(1)}</div>
                        {editMode ? (
                          <input type="number" style={inputStyleNumber} value={current.passives[k]} onChange={(e) => updateNested("passives", k, Number(e.target.value))} />
                        ) : (
                          <div>{current.passives[k]}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </>
            )}
          </div>
        </div>

        {/* Right: Portrait */}
        <div style={{ width: 300, padding: 10, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          {current?.imageUrl ? (
            <img src={current.imageUrl} alt={`${current.name} portrait`} style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 6, objectFit: "contain" }} />
          ) : (
            <div style={{ width: "100%", height: "80vh", borderRadius: 6, background: "#ddd", display: "flex", justifyContent: "center", alignItems: "center", color: "#666", fontStyle: "italic" }}>
              No Portrait
            </div>
          )}
          {editMode && <input type="text" placeholder="Image URL" style={{ marginTop: 10, width: "100%", padding: 6 }} value={current?.imageUrl || ""} onChange={(e) => updateField("imageUrl", e.target.value)} />}
        </div>
      </div>
    </div>
  );
}