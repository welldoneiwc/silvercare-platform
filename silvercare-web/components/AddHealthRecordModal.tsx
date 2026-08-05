"use client";

import {
  useEffect,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

export type HealthRecord = {
  id: number;
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  height: number;
  weight: number;
};

type Props = {
  open: boolean;
  editingRecord: HealthRecord | null;
  onClose: () => void;
  onSave: (
    record: Omit<HealthRecord, "id">
  ) => void;
};

export default function AddHealthRecordModal({
  open,
  editingRecord,
  onClose,
  onSave,
}: Props) {
  const [date, setDate] =
    useState("");

  const [systolic, setSystolic] =
    useState("");

  const [diastolic, setDiastolic] =
    useState("");

  const [pulse, setPulse] =
    useState("");

  const [height, setHeight] =
    useState("");

  const [weight, setWeight] =
    useState("");

  useEffect(() => {
    if (!open) return;

    if (editingRecord) {
      setDate(editingRecord.date);
      setSystolic(
        editingRecord.systolic.toString()
      );
      setDiastolic(
        editingRecord.diastolic.toString()
      );
      setPulse(
        editingRecord.pulse.toString()
      );
      setHeight(
        editingRecord.height.toString()
      );
      setWeight(
        editingRecord.weight.toString()
      );
    } else {
      setDate(
        new Date()
          .toISOString()
          .split("T")[0]
      );
      setSystolic("");
      setDiastolic("");
      setPulse("");
      setHeight("");
      setWeight("");
    }
  }, [open, editingRecord]);

  if (!open) {
    return null;
  }
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
          width: 500,
          background: "#fff",
          borderRadius: radius.lg,
          boxShadow: shadow.lg,
          padding: 24,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: colors.primary,
          }}
        >
          {editingRecord
            ? "編輯健康紀錄"
            : "新增健康紀錄"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: 16,
          }}
        >
          <div>
            <label>日期</label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>

          <div>
            <label>脈搏 (bpm)</label>

            <input
              type="number"
              value={pulse}
              onChange={(e) =>
                setPulse(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>

          <div>
            <label>收縮壓</label>

            <input
              type="number"
              value={systolic}
              onChange={(e) =>
                setSystolic(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>

          <div>
            <label>舒張壓</label>

            <input
              type="number"
              value={diastolic}
              onChange={(e) =>
                setDiastolic(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>

          <div>
            <label>身高 (cm)</label>

            <input
              type="number"
              value={height}
              onChange={(e) =>
                setHeight(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>

          <div>
            <label>體重 (kg)</label>

            <input
              type="number"
              value={weight}
              onChange={(e) =>
                setWeight(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>
        </div>
                <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 18px",
              border: "1px solid #D1D5DB",
              background: "#fff",
              borderRadius: radius.md,
              cursor: "pointer",
            }}
          >
            取消
          </button>

          <button
            onClick={() => {
              onSave({
                date,

                systolic:
                  Number(systolic),

                diastolic:
                  Number(diastolic),

                pulse:
                  Number(pulse),

                height:
                  Number(height),

                weight:
                  Number(weight),
              });

              setDate("");
              setSystolic("");
              setDiastolic("");
              setPulse("");
              setHeight("");
              setWeight("");
            }}
            style={{
              background:
                colors.primary,
              color: "#fff",
              border: "none",
              borderRadius:
                radius.md,
              padding:
                "10px 20px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {editingRecord
              ? "儲存修改"
              : "新增紀錄"}
          </button>
        </div>
      </div>
    </div>
  );
}