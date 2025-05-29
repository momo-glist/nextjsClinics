import React from "react";

export default function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
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
        <p>{`Consultations : ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
}
