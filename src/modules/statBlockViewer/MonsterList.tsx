import React from "react";
import type { Monster } from "./MonsterView";

interface MonsterListProps {
  monsters: Monster[];
  onSelect: (monster: Monster) => void;
  selectedMonster?: Monster | null;
}

const MonsterList: React.FC<MonsterListProps> = ({ monsters, onSelect, selectedMonster }) => {
  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        overflowY: "auto",
        maxHeight: "60vh",
      }}
    >
      {monsters.map((monster, i) => {
        const isSelected = selectedMonster?.name === monster.name;

        return (
          <li
            key={i}
            style={{
              cursor: "pointer",
              padding: "6px 8px",
              borderBottom: "1px solid #ccc",
              textAlign: "center",
              fontWeight: isSelected ? "bold" : "normal",
              backgroundColor: isSelected ? "#e6f7ff" : "transparent",
              borderRadius: 4,
              margin: "2px 0",
              transition: "background-color 0.2s",
            }}
            onClick={() => onSelect(monster)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = isSelected ? "#e6f7ff" : "transparent")
            }
          >
            {monster.name}
          </li>
        );
      })}
    </ul>
  );
};

export default MonsterList;
