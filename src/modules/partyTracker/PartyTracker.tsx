import { useState, useEffect } from "react";
import Button from "../../components/button";
import type { CharacterSheet } from "../characterSheets/CharacterSheets";

const xpThresholds = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000,
  305000, 355000
];

declare global {
  interface Window {
    playerViewWindow?: Window | null;
  }
}

export default function PartyTracker() {
  const [mode, setMode] = useState<"XP" | "Milestone">("XP");
  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);

  const [partyName, setPartyName] = useState("");
  const [characterSheets, setCharacterSheets] = useState<CharacterSheet[]>([]);

  const [numPlayers, setNumPlayers] = useState(1);
  const [characterNames, setCharacterNames] = useState<string[]>([""]);

  const [xpInput, setXpInput] = useState<number>(0);

  /** Load saved party data from localStorage */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("partyData") || "{}");

    if (saved.totalXP !== undefined) setTotalXP(saved.totalXP);
    if (saved.level !== undefined) setLevel(saved.level);
    if (saved.mode !== undefined) setMode(saved.mode);
    if (saved.partyName !== undefined) setPartyName(saved.partyName);

    if (Array.isArray(saved.characterNames)) {
      setCharacterNames(saved.characterNames);
    }

    if (saved.numPlayers !== undefined) {
      setNumPlayers(saved.numPlayers);
    } else if (Array.isArray(saved.characterNames)) {
      setNumPlayers(saved.characterNames.length || 1);
    }
  }, []);

  /** Load character sheets from localStorage */
  const loadCharacterSheets = () => {
    try {
      const stored: CharacterSheet[] = JSON.parse(localStorage.getItem("characterSheets_all") || "[]");
      console.log('Loaded character sheets:', stored);
      
      if (Array.isArray(stored)) {
        const normalized = stored.map(c => ({ ...c, party: c.party?.trim() || "" }));
        setCharacterSheets(normalized);
        console.log('Normalized character sheets:', normalized);
      }
    } catch (err) {
      console.error("Error loading character sheets:", err);
    }
  };

  useEffect(() => {
    loadCharacterSheets();
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "characterSheets_all") {
        console.log('Storage event detected, reloading...');
        loadCharacterSheets();
      }
    };
    
    window.addEventListener("storage", handleStorage);
    
    const interval = setInterval(() => {
      loadCharacterSheets();
    }, 2000);
    
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  /** Compute available parties dynamically */
  const parties = Array.from(new Set(characterSheets.map(c => c.party).filter(Boolean)));
  console.log('Available parties:', parties);

  /** Notify player view of updates */
  const notifyPlayerView = () => {
    if (window.playerViewWindow && !window.playerViewWindow.closed) {
      const data = { totalXP, level, mode, partyName, characterNames, numPlayers };
      window.playerViewWindow.postMessage({ type: "partyUpdate", data }, "*");
    }
  };

  /** Update level based on XP, save data, and notify player view */
  useEffect(() => {
    let newLevel = 1;
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
      if (totalXP >= xpThresholds[i]) {
        newLevel = i + 1;
        break;
      }
    }
    setLevel(newLevel);

    localStorage.setItem("partyData", JSON.stringify({
      totalXP,
      level: newLevel,
      mode,
      characterNames,
      partyName,
      numPlayers
    }));

    notifyPlayerView();
  }, [totalXP, mode, characterNames, partyName, numPlayers]);

  /** Update character sheets with new XP/Level */
  const updateCharacterSheetsXP = (newXP: number, newLevel: number) => {
    if (!partyName || partyName === "__custom") return;
    
    try {
      // Load fresh data from localStorage first
      const stored: CharacterSheet[] = JSON.parse(localStorage.getItem("characterSheets_all") || "[]");
      
      // Update all characters in the selected party
      const updated = stored.map(c => {
        if (c.party === partyName) {
          return { ...c, xp: newXP, level: newLevel };
        }
        return c;
      });
      
      // Save back to localStorage
      localStorage.setItem("characterSheets_all", JSON.stringify(updated));
      
      // Update individual character files
      updated.forEach(char => {
        if (char.party === partyName && char.filename) {
          localStorage.setItem(char.filename, JSON.stringify(char));
        }
      });
      
      // Refresh our local state
      setCharacterSheets(updated);
      
      // Dispatch custom event to notify Character Sheets component
      window.dispatchEvent(new CustomEvent('characterSheetsUpdated'));
      
      console.log('Updated character sheets for party:', partyName, 'to level:', newLevel, 'XP:', newXP);
      console.log('Updated characters:', updated.filter(c => c.party === partyName));
    } catch (err) {
      console.error('Error updating character sheets:', err);
    }
  };

  /** XP functions */
  const addXP = (amount: number) => {
    const newXP = Math.min(totalXP + Math.floor(amount / numPlayers), xpThresholds[19]);
    setTotalXP(newXP);
    
    // Calculate new level
    let newLevel = 1;
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
      if (newXP >= xpThresholds[i]) {
        newLevel = i + 1;
        break;
      }
    }
    updateCharacterSheetsXP(newXP, newLevel);
  };
  
  const subtractXP = (amount: number) => {
    const newXP = Math.max(totalXP - Math.floor(amount / numPlayers), 0);
    setTotalXP(newXP);
    
    // Calculate new level
    let newLevel = 1;
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
      if (newXP >= xpThresholds[i]) {
        newLevel = i + 1;
        break;
      }
    }
    updateCharacterSheetsXP(newXP, newLevel);
  };
  
  const setXP = (amount: number) => {
    const newXP = Math.max(0, Math.min(amount, xpThresholds[19]));
    setTotalXP(newXP);
    
    // Calculate new level
    let newLevel = 1;
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
      if (newXP >= xpThresholds[i]) {
        newLevel = i + 1;
        break;
      }
    }
    updateCharacterSheetsXP(newXP, newLevel);
  };
  
  const levelUp = () => {
    if (level >= 20) return;
    const newXP = xpThresholds[level];
    const newLevel = level + 1;
    setTotalXP(newXP);
    updateCharacterSheetsXP(newXP, newLevel);
  };

  /** Player management */
  const handleNumPlayersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = Number(e.target.value);
    setNumPlayers(count);
    setCharacterNames(prev => {
      const updated = [...prev];
      while (updated.length < count) updated.push("");
      while (updated.length > count) updated.pop();
      return updated;
    });
  };

  const handleCharacterNameChange = (index: number, name: string) => {
    const updated = [...characterNames];
    updated[index] = name;
    setCharacterNames(updated);
  };

  /** Handle party selection */
  const handlePartySelect = (selected: string) => {
    console.log('Party selected:', selected);
    setPartyName(selected);

    if (selected && selected !== "__custom") {
      const partyMembers = characterSheets.filter(c => c.party === selected);
      console.log('Party members found:', partyMembers);
      
      const members = partyMembers.map(c => c.name);
      setCharacterNames(members.length ? members : [""]);
      setNumPlayers(members.length || 1);
      
      // Set level and XP to highest in party
      if (partyMembers.length > 0) {
        const maxLevel = Math.max(...partyMembers.map(c => c.level));
        const maxLevelXP = xpThresholds[Math.min(maxLevel - 1, xpThresholds.length - 1)] || 0;
        console.log('Setting party to level:', maxLevel, 'with XP:', maxLevelXP);
        setTotalXP(maxLevelXP);
      }
    }
    notifyPlayerView();
  };

  /** Party view window */
  const openPartyView = () => {
    if (!window.playerViewWindow || window.playerViewWindow.closed) {
      window.playerViewWindow = window.open("/pt-pv.html", "partyTrackerView");
    }
    notifyPlayerView();
  };

  /** Reset party */
  const resetParty = () => {
    const cleanData = { totalXP: 0, level: 1, mode: "XP", partyName: "", characterNames: [""] , numPlayers: 1 };
    localStorage.setItem("partyData", JSON.stringify(cleanData));

    setMode("XP");
    setTotalXP(0);
    setLevel(1);
    setPartyName("");
    setNumPlayers(1);
    setCharacterNames([""]);
    notifyPlayerView();
  };

  /** Export / Import */
  const exportData = () => {
    const data = { totalXP, level, mode, partyName, characterNames, numPlayers };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${partyName.replace(/\s+/g, "_") || "party"}_party.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.totalXP !== undefined) setXP(json.totalXP);
        if (json.mode !== undefined) setMode(json.mode);
        if (json.partyName) setPartyName(json.partyName);
        if (Array.isArray(json.characterNames)) {
          setCharacterNames(json.characterNames);
        }
        if (json.numPlayers) setNumPlayers(json.numPlayers);

        notifyPlayerView();
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const currentLevelXP = Math.max(0, totalXP - xpThresholds[level - 1]);
  const nextLevelXP = level < 20 ? xpThresholds[level] - xpThresholds[level - 1] : 0;

  return (
    <div>
      <h2>Party Tracker</h2>
      <Button onClick={openPartyView} style={{ marginBottom: 10 }}>Open Player View</Button>
      <Button onClick={loadCharacterSheets} style={{ marginBottom: 10, marginLeft: 10 }}>Refresh Parties</Button>

      {/* Mode selection */}
      <div>
        <label><input type="radio" value="XP" checked={mode === "XP"} onChange={() => setMode("XP")} /> XP Based</label>
        <label style={{ marginLeft: 10 }}><input type="radio" value="Milestone" checked={mode === "Milestone"} onChange={() => setMode("Milestone")} /> Milestone Based</label>
      </div>

      {/* XP controls */}
      {mode === "XP" ? (
        <div style={{ marginTop: 10 }}>
          <input type="number" placeholder="XP amount" value={xpInput} onChange={e => setXpInput(Number(e.target.value))} />
          <Button onClick={() => addXP(xpInput)} style={{ marginLeft: 10 }}>Add XP</Button>
          <Button onClick={() => subtractXP(xpInput)} style={{ marginLeft: 10 }}>Subtract XP</Button>
          <Button onClick={() => setXP(xpInput)} style={{ marginLeft: 10 }}>Set XP</Button>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <Button onClick={levelUp}>Level Up</Button>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        {mode === "XP" ? <p>Level {level} | XP to next level: {currentLevelXP} / {nextLevelXP}</p> : <p>Level {level}</p>}
      </div>

      {/* Party selection */}
      <div style={{ margin: "20px 0" }}>
        <label>
          Select Party:{" "}
          <select
            value={partyName}
            onChange={e => handlePartySelect(e.target.value)}
          >
            <option value="">-- choose --</option>
            {parties.map(p => <option key={p} value={p}>{p}</option>)}
            <option value="__custom">Custom...</option>
          </select>
        </label>

        {(partyName === "__custom" || (partyName && !parties.includes(partyName))) && (
          <div style={{ marginTop: 10 }}>
            <label>
              Custom Name:{" "}
              <input
                type="text"
                placeholder="Enter custom party name"
                value={partyName === "__custom" ? "" : partyName}
                onChange={e => { setPartyName(e.target.value); notifyPlayerView(); }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Debug info */}
      <div style={{ marginTop: 20, padding: 10, background: "#f0f0f0", fontSize: "0.9em" }}>
        <strong>Debug Info:</strong>
        <div>Character Sheets Loaded: {characterSheets.length}</div>
        <div>Parties Found: {parties.length > 0 ? parties.join(", ") : "None"}</div>
      </div>

      {/* Players */}
      <div style={{ marginTop: 20 }}>
        <label>
          Number of Players:{" "}
          <select value={numPlayers} onChange={handleNumPlayersChange}>
            {[...Array(20)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
          </select>
        </label>
        <div style={{ marginTop: 10 }}>
          {characterNames.map((name, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`Player ${idx+1} Name`}
              value={name}
              onChange={e => handleCharacterNameChange(idx, e.target.value)}
              style={{ fontSize: "1.1em", margin: 5 }}
            />
          ))}
        </div>
      </div>

      {/* Reset / Export / Import */}
      <div style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <Button onClick={resetParty} type="danger">Reset Party</Button>
        </div>
        <div>
          <Button onClick={exportData} style={{ marginRight: 10 }}>Export JSON</Button>
          <Button onClick={() => document.getElementById("loadJsonInput")?.click()}>Load JSON</Button>
          <input id="loadJsonInput" type="file" accept=".json" style={{ display: "none" }} onChange={loadData} />
        </div>
      </div>
    </div>
  );
}