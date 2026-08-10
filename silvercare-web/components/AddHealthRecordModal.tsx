"use client";

import {
  ChangeEvent,
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

  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);

  const [isRecognizing, setIsRecognizing] =
    useState(false);

  const [recognized, setRecognized] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    setPhotoPreview(null);
    setIsRecognizing(false);
    setRecognized(false);

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

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      setPhotoPreview(
        typeof reader.result ===
          "string"
          ? reader.result
          : null
      );

      setRecognized(false);
    };

    reader.readAsDataURL(file);
  };

  const handleStartRecognition = () => {
    if (!photoPreview) {
      alert("請先拍照或上傳健康量測照片。");
      return;
    }

    /*
     * 目前先建立 AI 辨識流程的 UI。
     *
     * 真正的 AI OCR / Vision API
     * 下一步再接入。
     *
     * 這裡不會把照片儲存到
     * LocalStorage。
     */

    setIsRecognizing(true);

    window.setTimeout(() => {
      setIsRecognizing(false);
      setRecognized(true);

      alert(
        "照片已準備完成。下一步將接入 AI 辨識量測數值。"
      );
    }, 800);
  };

  const handleSave = () => {
    if (!date) {
      alert("請選擇日期");
      return;
    }

    if (
      !systolic ||
      !diastolic ||
      !pulse ||
      !height ||
      !weight
    ) {
      alert(
        "目前請確認血壓、脈搏、身高與體重都有辨識結果。"
      );
      return;
    }

    onSave({
      date,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      pulse: Number(pulse),
      height: Number(height),
      weight: Number(weight),
    });

    setDate("");
    setSystolic("");
    setDiastolic("");
    setPulse("");
    setHeight("");
    setWeight("");
    setPhotoPreview(null);
    setRecognized(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,0.35)",
        display: "flex",
        justifyContent:
          "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth:
            "calc(100vw - 32px)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: radius.lg,
          boxShadow: shadow.lg,
          padding: 24,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            color: colors.primary,
          }}
        >
          {editingRecord
            ? "編輯健康紀錄"
            : "新增健康紀錄"}
        </h2>

        <p
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: "#6B7280",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          拍攝或上傳健康量測設備畫面，
          下一步由 AI 自動辨識血壓、
          脈搏、身高與體重。
        </p>

        <div
          style={{
            padding: 18,
            borderRadius: radius.md,
            background: "#F7FAFC",
            border:
              "1px solid #E5E7EB",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: colors.primary,
              marginBottom: 12,
            }}
          >
            📷 健康量測照片
          </div>

          <label
            style={{
              display: "block",
              padding: "14px 18px",
              borderRadius: radius.md,
              background: "#fff",
              border:
                "1px solid #D1D5DB",
              textAlign: "center",
              cursor: "pointer",
              fontWeight: 600,
              color: colors.primary,
            }}
          >
            {photoPreview
              ? "重新選擇照片"
              : "📷 拍照／上傳照片"}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={
                handlePhotoChange
              }
              style={{
                display: "none",
              }}
            />
          </label>

          {photoPreview && (
            <div
              style={{
                marginTop: 16,
              }}
            >
              <img
                src={photoPreview}
                alt="健康量測照片預覽"
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: 260,
                  objectFit: "contain",
                  borderRadius:
                    radius.md,
                  background:
                    "#111827",
                }}
              />

              <button
                type="button"
                onClick={
                  handleStartRecognition
                }
                disabled={
                  isRecognizing
                }
                style={{
                  width: "100%",
                  marginTop: 14,
                  padding: 12,
                  border: "none",
                  borderRadius:
                    radius.md,
                  background:
                    isRecognizing
                      ? "#9CA3AF"
                      : colors.primary,
                  color: "#fff",
                  cursor:
                    isRecognizing
                      ? "default"
                      : "pointer",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {isRecognizing
                  ? "AI 辨識準備中..."
                  : "🤖 開始 AI 辨識"}
              </button>
            </div>
          )}

          {recognized && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius:
                  radius.md,
                background:
                  "#ECFDF5",
                color: "#166534",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ✓ 已進入辨識結果確認流程
            </div>
          )}

          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "#6B7280",
              lineHeight: 1.6,
            }}
          >
            照片目前只用於辨識流程，
            不會寫入健康紀錄
            LocalStorage。
          </div>
        </div>

        <div
          style={{
            padding: 18,
            borderRadius: radius.md,
            border:
              "1px solid #E5E7EB",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: colors.primary,
              marginBottom: 16,
            }}
          >
            📋 辨識結果確認
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 16,
            }}
          >
            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >
              <label>
                日期
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(
                    e.target.value
                  )
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label>
                收縮壓
              </label>

              <input
                type="number"
                value={systolic}
                onChange={(e) =>
                  setSystolic(
                    e.target.value
                  )
                }
                placeholder="AI 辨識結果"
                style={inputStyle}
              />
            </div>

            <div>
              <label>
                舒張壓
              </label>

              <input
                type="number"
                value={diastolic}
                onChange={(e) =>
                  setDiastolic(
                    e.target.value
                  )
                }
                placeholder="AI 辨識結果"
                style={inputStyle}
              />
            </div>

            <div>
              <label>
                脈搏 (bpm)
              </label>

              <input
                type="number"
                value={pulse}
                onChange={(e) =>
                  setPulse(
                    e.target.value
                  )
                }
                placeholder="AI 辨識結果"
                style={inputStyle}
              />
            </div>

            <div>
              <label>
                身高 (cm)
              </label>

              <input
                type="number"
                value={height}
                onChange={(e) =>
                  setHeight(
                    e.target.value
                  )
                }
                placeholder="AI 辨識結果"
                style={inputStyle}
              />
            </div>

            <div>
              <label>
                體重 (kg)
              </label>

              <input
                type="number"
                value={weight}
                onChange={(e) =>
                  setWeight(
                    e.target.value
                  )
                }
                placeholder="AI 辨識結果"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding:
                "10px 18px",
              border:
                "1px solid #D1D5DB",
              background: "#fff",
              borderRadius:
                radius.md,
              cursor: "pointer",
            }}
          >
            取消
          </button>

          <button
            type="button"
            onClick={
              handleSave
            }
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
              : "確認並儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  border:
    "1px solid #D1D5DB",
  borderRadius: radius.md,
  boxSizing: "border-box",
  background: "#fff",
};