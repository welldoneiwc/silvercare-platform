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
  height: number | null;
  weight: number | null;
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
  const [date, setDate] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

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
        editingRecord.height !== null
          ? editingRecord.height.toString()
          : ""
      );

      setWeight(
        editingRecord.weight !== null
          ? editingRecord.weight.toString()
          : ""
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

  /**
   * 將手機照片轉成 JPEG Data URL。
   *
   * 這可以避免 iPhone / Safari 拍攝的
   * HEIC / HEIF 等格式直接送到 AI API
   * 時造成圖片格式錯誤。
   */
  const convertImageToJpeg = (
    file: File
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const objectUrl =
        URL.createObjectURL(file);

      const image = new Image();

      image.onload = () => {
        try {
          const maxWidth = 1600;
          const maxHeight = 1600;

          let width = image.naturalWidth;
          let height = image.naturalHeight;

          if (
            width > maxWidth ||
            height > maxHeight
          ) {
            const ratio = Math.min(
              maxWidth / width,
              maxHeight / height
            );

            width = Math.round(
              width * ratio
            );

            height = Math.round(
              height * ratio
            );
          }

          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext("2d");

          if (!context) {
            URL.revokeObjectURL(objectUrl);
            reject(
              new Error(
                "無法處理照片，請重新拍攝。"
              )
            );
            return;
          }

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          const jpegDataUrl =
            canvas.toDataURL(
              "image/jpeg",
              0.82
            );

          URL.revokeObjectURL(objectUrl);

          if (
            !jpegDataUrl.startsWith(
              "data:image/jpeg;"
            )
          ) {
            reject(
              new Error(
                "照片格式轉換失敗，請重新拍攝。"
              )
            );
            return;
          }

          resolve(jpegDataUrl);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        reject(
          new Error(
            "無法讀取這張照片，請重新拍攝或選擇照片。"
          )
        );
      };

      image.src = objectUrl;
    });
  };

  const handlePhotoChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      const jpegDataUrl =
        await convertImageToJpeg(file);

      setPhotoPreview(jpegDataUrl);
      setRecognized(false);
    } catch (error) {
      console.error(
        "Photo conversion error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "照片讀取失敗，請重新拍攝。"
      );

      event.target.value = "";
    }
  };

  const handleStartRecognition =
    async () => {
      if (!photoPreview) {
        alert(
          "請先拍照或上傳健康量測照片。"
        );
        return;
      }

      setIsRecognizing(true);
      setRecognized(false);

      try {
        if (
          !photoPreview.startsWith(
            "data:image/jpeg;"
          )
        ) {
          throw new Error(
            "照片格式不正確，請重新拍攝。"
          );
        }

        const response = await fetch(
          "/api/openai",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              image: photoPreview,
            }),
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "AI 辨識失敗"
          );
        }

        let result = data.result;

        if (typeof result === "string") {
          const text =
            result.trim();

          try {
            result = JSON.parse(text);
          } catch {
            const match =
              text.match(
                /(\d{2,3})\s*[/／]\s*(\d{2,3})\s*[/／]\s*(\d{2,3})/
              );

            if (match) {
              result = {
                systolic:
                  Number(match[1]),
                diastolic:
                  Number(match[2]),
                pulse:
                  Number(match[3]),
              };
            }
          }
        }

        console.log(
          "AI recognition result:",
          result
        );

        if (
          result &&
          typeof result ===
            "object"
        ) {
          if (
            "systolic" in result &&
            result.systolic !==
              null &&
            result.systolic !==
              undefined
          ) {
            setSystolic(
              String(
                result.systolic
              )
            );
          }

          if (
            "diastolic" in result &&
            result.diastolic !==
              null &&
            result.diastolic !==
              undefined
          ) {
            setDiastolic(
              String(
                result.diastolic
              )
            );
          }

          if (
            "pulse" in result &&
            result.pulse !==
              null &&
            result.pulse !==
              undefined
          ) {
            setPulse(
              String(result.pulse)
            );
          }

          if (
            "height" in result &&
            result.height !==
              null &&
            result.height !==
              undefined
          ) {
            setHeight(
              String(result.height)
            );
          }

          if (
            "weight" in result &&
            result.weight !==
              null &&
            result.weight !==
              undefined
          ) {
            setWeight(
              String(result.weight)
            );
          }
        }

        setRecognized(true);

        alert(
          "AI 辨識完成，請確認下方結果。"
        );
      } catch (error) {
        console.error(
          "AI recognition error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "AI 辨識失敗，請稍後再試。"
        );
      } finally {
        setIsRecognizing(false);
      }
    };

  const handleSave = () => {
    if (!date) {
      alert("請選擇日期");
      return;
    }

    if (
      !systolic ||
      !diastolic ||
      !pulse
    ) {
      alert(
        "目前請確認血壓與脈搏都有辨識結果。"
      );
      return;
    }

    const heightValue =
      height.trim() === ""
        ? null
        : Number(height);

    const weightValue =
      weight.trim() === ""
        ? null
        : Number(weight);

    onSave({
      date,
      systolic:
        Number(systolic),
      diastolic:
        Number(diastolic),
      pulse: Number(pulse),
      height: heightValue,
      weight: weightValue,
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
    <>
      <style>{`
        .silvercare-health-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999;
          padding: 16px;
          box-sizing: border-box;
        }

        .silvercare-health-modal-card {
          width: 560px;
          max-width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: ${radius.lg}px;
          box-shadow: ${shadow.lg};
          padding: 24px;
          box-sizing: border-box;
        }

        .silvercare-health-result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .silvercare-health-action-row {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .silvercare-health-action-row button {
          flex: 0 0 auto;
        }

        @media (max-width: 767px) {
          .silvercare-health-modal {
            align-items: flex-start;
            padding: 12px;
            overflow-y: auto;
          }

          .silvercare-health-modal-card {
            width: 100%;
            max-width: 100%;
            max-height: calc(100vh - 24px);
            padding: 18px;
            border-radius: 14px;
          }

          .silvercare-health-result-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .silvercare-health-action-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .silvercare-health-action-row button {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .silvercare-health-modal-card {
            padding: 16px;
          }

          .silvercare-health-action-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="silvercare-health-modal">
        <div className="silvercare-health-modal-card">
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
            AI 將自動辨識血壓、
            脈搏、身高與體重。
            無法從照片辨識的項目會保留空白，
            不會自行猜測數值。
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
                accept="image/jpeg,image/png,image/webp,image/*"
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
                    ? "AI 辨識中..."
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
                ✓ AI 辨識完成，請確認結果
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
              照片只用於 AI
              辨識流程，不會寫入健康紀錄
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

            <div className="silvercare-health-result-grid">
              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label>日期</label>

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
                <label>收縮壓</label>

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
                <label>舒張壓</label>

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
                  placeholder="可留白"
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
                  placeholder="可留白"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div className="silvercare-health-action-row">
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px",
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
              onClick={handleSave}
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
    </>
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