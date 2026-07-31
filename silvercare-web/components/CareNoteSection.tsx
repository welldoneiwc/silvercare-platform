"use client";

export default function CareNoteSection() {
  return (
    <div>
      <h3
        style={{
          color: "#163A43",
          marginBottom: "12px",
        }}
      >
        照護備註
      </h3>

      <div
        style={{
          border: "1px dashed #d1d5db",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
          background: "#fafafa",
          color: "#888",
          fontSize: "15px",
        }}
      >
        尚未建立照護備註。
      </div>
    </div>
  );
}