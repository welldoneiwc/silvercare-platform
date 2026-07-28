"use client";

import { useEffect, useState } from "react";

type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};

type Props = {
  open: boolean;
  onClose: () => void;

  onSave: (elder: {
    name: string;
    gender: string;
    birthday: string;
    phone: string;
  }) => void;

  onUpdate: (elder: Elder) => void;

  isEditing: boolean;

  editingElder: Elder | null;
};

export default function AddElderModal({
  open,
  onClose,
  onSave,
  onUpdate,
  isEditing,
  editingElder,
}: Props) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("男");
  const [birthday, setBirthday] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!open) return;

    if (isEditing && editingElder) {
      setName(editingElder.name);
      setGender(editingElder.gender);
      setBirthday(editingElder.birthday);
      setPhone(editingElder.phone);
    } else {
      setName("");
      setGender("男");
      setBirthday("");
      setPhone("");
    }
  }, [open, isEditing, editingElder]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!name || !birthday || !phone) {
      alert("請完整填寫資料");
      return;
    }

    if (isEditing && editingElder) {
      onUpdate({
        id: editingElder.id,
        name,
        gender,
        birthday,
        phone,
      });
    } else {
      onSave({
        name,
        gender,
        birthday,
        phone,
      });
    }

    setName("");
    setGender("男");
    setBirthday("");
    setPhone("");

    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: "white",
          width: "420px",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <h2>{isEditing ? "編輯長者" : "新增長者"}</h2>

        <div style={{ marginTop: "20px" }}>
          <label>姓名</label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginTop: "15px" }}>
          <label>性別</label>

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          >
            <option>男</option>
            <option>女</option>
          </select>
        </div>

        <div style={{ marginTop: "15px" }}>
          <label>生日</label>

          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginTop: "15px" }}>
          <label>電話</label>

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "25px",
          }}
        >
          <button onClick={onClose}>取消</button>

          <button
            onClick={handleSubmit}
            style={{
              background: "#163A43",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
            }}
          >
            {isEditing ? "更新資料" : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}