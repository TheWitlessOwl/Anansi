import { useState, useEffect } from "react";
import PartyTracker from "./modules/partyTracker/PartyTracker";
import Settings from "./modules/settings/Settings";
import StatBlockViewer from "./modules/statBlockViewer/StatBlockViewer";
import CharacterSheets from "./modules/characterSheets/CharacterSheets";
import { Users, Sword, Scroll, Book, Shield, ShoppingCart, Settings as Cog } from "lucide-react";

interface SidebarItemProps {
  name: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ name, icon, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
      fontWeight: active ? "bold" : "normal",
      color: active ? "#ffd700" : "white",
      background: "transparent",
      border: "none",
      padding: "6px 10px",
      borderRadius: 4,
      transition: "background-color 0.2s, color 0.3s",
      flexShrink: 0,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
  >
    {icon}
    <span>{name}</span>
  </button>
);

function MainUI() {
  const [activeModule, setActiveModule] = useState("Party Tracker");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const modules = [
    { name: "Party Tracker", icon: <Users size={20} /> },
    { name: "Combat Tracker", icon: <Sword size={20} /> },
    { name: "Encounter Builder", icon: <Scroll size={20} /> },
    { name: "Character Sheets", icon: <Book size={20} /> },
    { name: "Stat Blocks", icon: <Shield size={20} /> },
    { name: "Randomized Shops", icon: <ShoppingCart size={20} /> },
    { name: "Settings", icon: <Cog size={20} /> },
  ];

  // Store modules as component references
  const moduleComponents: Record<string, React.FC> = {
    "Party Tracker": PartyTracker,
    "Stat Blocks": StatBlockViewer,
    "Character Sheets": CharacterSheets,
    "Settings": Settings,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: windowWidth - 30,
          maxWidth: "100%",
          padding: "10px 15px",
          backgroundColor: "#222",
          color: "white",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, flexShrink: 0 }}>Anansi - The DM Toolkit</h2>

        {/* Module buttons */}
        <div style={{ display: "flex", gap: 12, flexGrow: 1, justifyContent: "flex-start", flexWrap: "wrap" }}>
          {modules.map((module) => (
            <SidebarItem
              key={module.name}
              name={module.name}
              icon={module.icon}
              active={activeModule === module.name}
              onClick={() => setActiveModule(module.name)}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", width: windowWidth - 40, overflow: "hidden", padding: 20 }}>
        <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
          {Object.entries(moduleComponents).map(([name, Component]) => (
            <div
              key={name}
              style={{ display: activeModule === name ? "block" : "none", height: "100%" }}
            >
              <Component />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MainUI;
