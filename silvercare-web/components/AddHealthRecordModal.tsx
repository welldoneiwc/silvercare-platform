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

type RecognitionResult = {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  height: number | null;
  weight: number | null;
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

  /*
   * 將手機拍攝的圖片轉成 JPEG。
   *
   * iPhone 可能提供 HEIC / HEIF，
   * 但 /api/openai 目前接受的是
   * JPEG / PNG / WEBP / GIF。
   *
   * 先在瀏覽器轉成 JPEG，
   * 再送給 AI，可避免手機圖片格式造成
   * AI API 無法辨識的問題。
   */
  const convertImageToJpeg = (
    file: File
  ): Promise<string> => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          const result =
            reader.result;

          if (
            typeof result !==
            "string"
          ) {
            reject(
              new Error(
                "無法讀取照片，請重新選擇照片。"
              )
            );
            return;
          }

          const image =
            new Image();

          image.onload = () => {
            const maxSize = 1600;

            let width =
              image.naturalWidth;

            let height =
              image.naturalHeight;

            if (
              width > maxSize ||
              height > maxSize
            ) {
              const scale =
                Math.min(
                  maxSize / width,
                  maxSize / height
                );

              width =
                Math.round(
                  width * scale
                );

              height =
                Math.round(
                  height * scale
                );
            }

            const canvas =
              document.createElement(
                "canvas"
              );

            canvas.width =
              width;

            canvas.height =
              height;

            const context =
              canvas.getContext(
                "2d"
              );

            if (!context) {
              reject(
                new Error(
                  "無法處理照片，請重新選擇照片。"
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

            const jpeg =
              canvas.toDataURL(
                "image/jpeg",
                0.85
              );

            if (
              !jpeg.startsWith(
                "data:image/jpeg"
              )
            ) {
              reject(
                new Error(
                  "照片格式轉換失敗，請重新拍攝照片。"
                )
              );
              return;
            }

            resolve(jpeg);
          };

          image.onerror = () => {
            reject(
              new Error(
                "無法讀取這張照片，請重新拍攝或選擇照片。"
              )
            );
          };

          image.src = result;
        };

        reader.onerror = () => {
          reject(
            new Error(
              "照片讀取失敗，請重新選擇照片。"
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  };

  const handlePhotoChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      setRecognized(false);

      const jpeg =
        await convertImageToJpeg(
          file
        );

      setPhotoPreview(jpeg);
    } catch (error) {
      console.error(
        "健康量測照片處理失敗：",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "照片處理失敗，請重新選擇照片。";

      alert(message);
    } finally {
      /*
       * 讓同一張照片再次選擇時，
       * iPhone 也能觸發 onChange。
       */
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
        const response =
          await fetch(
            "/api/openai",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                image:
                  photoPreview,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.error ||
              "AI 辨識失敗，請稍後再試。"
          );
        }

        const rawResult =
          typeof data.result ===
          "string"
            ? data.result.trim()
            : "";

        if (!rawResult) {
          throw new Error(
            "AI 沒有回傳辨識結果，請重新拍照。"
          );
        }

        let parsedResult:
          RecognitionResult;

        try {
          parsedResult =
            JSON.parse(
              rawResult
            );
        } catch {
          const cleanedResult =
            rawResult
              .replace(
                /^```json\s*/i,
                ""
              )
              .replace(
                /^```\s*/i,
                ""
              )
              .replace(
                /\s*```$/i,
                ""
              )
              .trim();

          parsedResult =
            JSON.parse(
              cleanedResult
            );
        }

        if (
          parsedResult.systolic !==
            null &&
          typeof parsedResult.systolic ===
            "number"
        ) {
          setSystolic(
            String(
              parsedResult.systolic
            )
          );
        }

        if (
          parsedResult.diastolic !==
            null &&
          typeof parsedResult.diastolic ===
            "number"
        ) {
          setDiastolic(
            String(
              parsedResult.diastolic
            )
          );
        }

        if (
          parsedResult.pulse !==
            null &&
          typeof parsedResult.pulse ===
            "number"
        ) {
          setPulse(
            String(
              parsedResult.pulse
            )
          );
        }

        if (
          parsedResult.height !==
            null &&
          typeof parsedResult.height ===
            "number"
        ) {
          setHeight(
            String(
              parsedResult.height
            )
          );
        }

        if (
          parsedResult.weight !==
            null &&
          typeof parsedResult.weight ===
            "number"
        ) {
          setWeight(
            String(
              parsedResult.weight
            )
          );
        }

        /*
         * 儲存所需的核心資料：
         * 收縮壓 + 舒張壓 + 脈搏。
         *
         * 身高、體重可以沒有。
         */
        const hasBloodPressure =
          parsedResult.systolic !==
            null &&
          parsedResult.diastolic !==
            null;

        const hasPulse =
          parsedResult.pulse !==
          null;

        if (
          !hasBloodPressure ||
          !hasPulse
        ) {
          throw new Error(
            "AI 無法從照片清楚辨識收縮壓、舒張壓與脈搏，請重新拍攝清楚的量測畫面。"
          );
        }

        setRecognized(true);

        alert(
          "AI 辨識完成，請確認辨識結果後再儲存。"
        );
      } catch (error) {
        console.error(
          "健康量測 AI 辨識失敗：",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "AI 辨識失敗，請稍後再試。";

        alert(message);
      } finally {
        setIsRecognizing(false);
      }
    };

  const handleSave = () => {
    if (!date) {
      alert("請選擇日期");
      return;
    }

    /*
     * 只要求：
     * 收縮壓 + 舒張壓 + 脈搏
     *
     * 身高、體重可以留空。
     */
    if (
      !systolic ||
      !diastolic ||
      !pulse
    ) {
      alert(
        "請確認收縮壓、舒張壓與脈搏都有辨識結果。"
      );
      return;
    }

    onSave({
      date,
      systolic:
        Number(systolic),
      diastolic:
        Number(diastolic),
      pulse:
        Number(pulse),
      height:
        height.trim() !== ""
          ? Number(height)
          : null,
      weight:
        weight.trim() !== ""
          ? Number(weight)
          : null,
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
        zIndex: 99999,
        padding:
          "16px 16px calc(16px + env(safe-area-inset-bottom))",
        boxSizing:
          "border-box",
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth:
            "calc(100vw - 32px)",
          maxHeight:
            "calc(100dvh - 32px)",
          overflowY: "auto",
          background: "#fff",
          borderRadius:
            radius.lg,
          boxShadow:
            shadow.lg,
          padding:
            "24px 24px calc(120px + env(safe-area-inset-bottom))",
          boxSizing:
            "border-box",
          overscrollBehavior:
            "contain",
          WebkitOverflowScrolling:
            "touch",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            color:
              colors.primary,
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
          由 AI 自動辨識血壓、脈搏、
          身高與體重。
        </p>

        <div
          style={{
            padding: 18,
            borderRadius:
              radius.md,
            background:
              "#F7FAFC",
            border:
              "1px solid #E5E7EB",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color:
                colors.primary,
              marginBottom: 12,
            }}
          >
            📷 健康量測照片
          </div>

          <label
            style={{
              display: "block",
              padding:
                "14px 18px",
              borderRadius:
                radius.md,
              background:
                "#fff",
              border:
                "1px solid #D1D5DB",
              textAlign:
                "center",
              cursor:
                "pointer",
              fontWeight: 600,
              color:
                colors.primary,
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
                  display:
                    "block",
                  width: "100%",
                  maxHeight: 260,
                  objectFit:
                    "contain",
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
                  border:
                    "none",
                  borderRadius:
                    radius.md,
                  background:
                    isRecognizing
                      ? "#9CA3AF"
                      : colors.primary,
                  color:
                    "#fff",
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
                color:
                  "#166534",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ✓ AI 辨識完成，請確認下方結果
            </div>
          )}

          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color:
                "#6B7280",
              lineHeight: 1.6,
            }}
          >
            照片只用於 AI 辨識流程，
            不會寫入健康紀錄
            LocalStorage。
          </div>
        </div>

        <div
          style={{
            padding: 18,
            borderRadius:
              radius.md,
            border:
              "1px solid #E5E7EB",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color:
                colors.primary,
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
                value={
                  systolic
                }
                onChange={(e) =>
                  setSystolic(
                    e.target.value
                  )
                }
                placeholder="AI 辨識結果"
                style={
                  inputStyle
                }
              />
            </div>

            <div>
              <label>
                舒張壓
              </label>

              <input
                type="number"
                value={
                  diastolic
                }
                onChange={(e) =>
                  setDiastolic(
                    e.target.value
                  )
                }
                placeholder="AI 辨識結果"
                style={
                  inputStyle
                }
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
                style={
                  inputStyle
                }
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
                placeholder="AI 辨識結果（可留空）"
                style={
                  inputStyle
                }
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
                placeholder="AI 辨識結果（可留空）"
                style={
                  inputStyle
                }
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
            flexWrap:
              "wrap",
            paddingBottom: 8,
          }}
        >
          <button
            type="button"
            onClick={
              onClose
            }
            style={{
              padding:
                "10px 18px",
              border:
                "1px solid #D1D5DB",
              background:
                "#fff",
              borderRadius:
                radius.md,
              cursor:
                "pointer",
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
              border:
                "none",
              borderRadius:
                radius.md,
              padding:
                "10px 20px",
              cursor:
                "pointer",
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
  borderRadius:
    radius.md,
  boxSizing:
    "border-box",
  background:
    "#fff",
};