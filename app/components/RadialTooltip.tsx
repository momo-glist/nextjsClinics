import React from "react";

export default function RadialTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // accès aux vraies données

    return (
      <div
        style={{
          backgroundColor: "white",
          border: "none",
          borderRadius: "8px",
          padding: "6px 12px",
          fontSize: "12px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        <p>{`${data.name} : ${data.value}`}</p>
      </div>
    );
  }

  return null;
}
