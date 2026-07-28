"use client";

import { useState } from "react";

type HealthRecord = {
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  height: number;
  weight: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (record: HealthRecord) => void;
};

export default function AddHealthRecordModal({
  open,
  onClose,
  onSave,
}: Props) {
  const [date, setDate] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");

  if (!open) return null;

  const handleSave = () => {
    if (
      !date ||
      !height ||
      !weight ||
      !systolic ||
      !diastolic ||
      !pulse
    ) {
      alert("請完整填寫所有資料");
      return;
    }

    onSave({
      date,
      height: Number(height),
      weight: Number(weight),
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      pulse: Number(pulse),
    });

    setDate("");
    setHeight("");
    setWeight("");
    setSystolic("");
    setDiastolic("");
    setPulse("");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "520px",
          background: "#fff",
          borderRadius: "16px",
          padding: "28px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#163A43",
          }}
        >
          新增健康量測
        </h2>

        <div
          style={{
            display: "grid",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="身高(cm)"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="體重(kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="收縮壓(mmHg)"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="舒張壓(mmHg)"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="脈搏(bpm)"
            value={pulse}
            onChange={(e) => setPulse(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "28px",
          }}
        >
          <button
            onClick={onClose}
            style={cancelButton}
          >
            取消
          </button>

          <button
            onClick={handleSave}
            style={saveButton}
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "15px",
};

const cancelButton = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "#fff",
};

const saveButton = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "none",
  background: "#163A43",
  color: "#fff",
  cursor: "pointer",
};