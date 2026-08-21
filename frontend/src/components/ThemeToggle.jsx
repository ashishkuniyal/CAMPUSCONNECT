import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.body.style.background = dark ? "#0f172a" : "#fff";
    document.body.style.color = dark ? "#e2e8f0" : "#000";
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      style={{
        border: "none",
        background: "transparent",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
