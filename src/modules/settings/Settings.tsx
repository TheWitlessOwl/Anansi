import { useState, useEffect } from "react";

function Settings() {
  const presetColors = ["rainbow", "red", "green", "blue", "purple", "orange", "custom"];
  const presetFontColors = ["black", "white", "gold", "silver", "red", "blue", "custom"];

  const [xpBarColor, setXpBarColor] = useState<string>(
    localStorage.getItem("xpBarColor") || "rainbow"
  );
  const [isCustomXpBar, setIsCustomXpBar] = useState<boolean>(false);
  const [customXpBarHex, setCustomXpBarHex] = useState<string>("");

  const [showPartyTitle, setShowPartyTitle] = useState<boolean>(true);

  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>(
    localStorage.getItem("backgroundImageUrl") || ""
  );

  const [fontColor, setFontColor] = useState<string>(
    localStorage.getItem("fontColor") || "black"
  );
  const [isCustomFont, setIsCustomFont] = useState<boolean>(false);
  const [customFontHex, setCustomFontHex] = useState<string>("");

  // Initialize from localStorage
  useEffect(() => {
    // XP Bar Color
    const savedColor = localStorage.getItem("xpBarColor");
    if (savedColor) {
      if (presetColors.includes(savedColor)) {
        setXpBarColor(savedColor);
        setIsCustomXpBar(false);
      } else if (/^#([0-9A-Fa-f]{6})$/.test(savedColor)) {
        setXpBarColor("custom");
        setCustomXpBarHex(savedColor);
        setIsCustomXpBar(true);
      }
    }

    // Party Title Toggle
    const savedTitle = localStorage.getItem("showPartyTitle");
    if (savedTitle !== null) {
      setShowPartyTitle(JSON.parse(savedTitle));
    }

    // Background Image
    const savedBg = localStorage.getItem("backgroundImageUrl");
    if (savedBg) {
      setBackgroundImageUrl(savedBg);
    }

    // Font Color
    const savedFont = localStorage.getItem("fontColor");
    if (savedFont) {
      if (presetFontColors.includes(savedFont)) {
        setFontColor(savedFont);
        setIsCustomFont(false);
      } else if (/^#([0-9A-Fa-f]{6})$/.test(savedFont)) {
        setFontColor("custom");
        setCustomFontHex(savedFont);
        setIsCustomFont(true);
      }
    }
  }, []);

  const handleXpBarSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setXpBarColor("custom");
      setIsCustomXpBar(true);
      if (customXpBarHex) {
        localStorage.setItem("xpBarColor", customXpBarHex);
      }
    } else {
      setXpBarColor(value);
      setIsCustomXpBar(false);
      localStorage.setItem("xpBarColor", value);
    }
  };

  const handleXpBarHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomXpBarHex(value);
    if (/^#([0-9A-Fa-f]{6})$/.test(value)) {
      localStorage.setItem("xpBarColor", value);
    }
  };

  const handleFontSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setFontColor("custom");
      setIsCustomFont(true);
      if (customFontHex) {
        localStorage.setItem("fontColor", customFontHex);
      }
    } else {
      setFontColor(value);
      setIsCustomFont(false);
      localStorage.setItem("fontColor", value);
    }
  };

  const handleFontHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomFontHex(value);
    if (/^#([0-9A-Fa-f]{6})$/.test(value)) {
      localStorage.setItem("fontColor", value);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBackgroundImageUrl(value);
    localStorage.setItem("backgroundImageUrl", value);
  };

  const togglePartyTitle = () => {
    const newValue = !showPartyTitle;
    setShowPartyTitle(newValue);
    localStorage.setItem("showPartyTitle", JSON.stringify(newValue));
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Settings</h3>

      {/* XP Bar Color */}
      <div style={{ marginBottom: "15px" }}>
        <label>
          XP Bar Color:{" "}
          <select value={isCustomXpBar ? "custom" : xpBarColor} onChange={handleXpBarSelectChange}>
            {presetColors.map((color) => (
              <option key={color} value={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {isCustomXpBar && (
          <input
            type="text"
            placeholder="#RRGGBB"
            value={customXpBarHex}
            onChange={handleXpBarHexChange}
            style={{ marginLeft: "10px" }}
          />
        )}
      </div>

      {/* Background Image */}
      <div style={{ marginBottom: "15px" }}>
        <label>
          Background Image URL:{" "}
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={backgroundImageUrl}
            onChange={handleBackgroundChange}
            style={{ width: "300px" }}
          />
        </label>
      </div>

      {/* Font Color */}
      <div style={{ marginBottom: "15px" }}>
        <label>
          Font Color:{" "}
          <select value={isCustomFont ? "custom" : fontColor} onChange={handleFontSelectChange}>
            {presetFontColors.map((color) => (
              <option key={color} value={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {isCustomFont && (
          <input
            type="text"
            placeholder="#RRGGBB"
            value={customFontHex}
            onChange={handleFontHexChange}
            style={{ marginLeft: "10px" }}
          />
        )}
      </div>

      {/* Party Title Toggle */}
      <div style={{ marginTop: "10px" }}>
        <label>
          <input
            type="checkbox"
            checked={showPartyTitle}
            onChange={togglePartyTitle}
          />
          Show Party Tracker Title
        </label>
      </div>
    </div>
  );
}

export default Settings;