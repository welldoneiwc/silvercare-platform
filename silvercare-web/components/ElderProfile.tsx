"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AddHealthRecordModal from "./AddHealthRecordModal";
import HealthRecordTable from "./HealthRecordTable";
import HealthTrendChart from "./HealthTrendChart";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

import { notifyStorageChanged } from "../utils/storageEvents";

export type HealthRecord = {
  id: number;
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  height: number | null;
  weight: number | null;
};

type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};

type PersonalConsentRecord = {
  elderId: number;
  agreed: boolean;
  agreedAt: string | null;
  version: string;
  signatureDataUrl: string | null;
  signedAt: string | null;
};

type Props = {
  elder: Elder | null;
};

const PERSONAL_CONSENT_STORAGE_KEY =
  "silvercare-personal-consents";

const PERSONAL_CONSENT_VERSION =
  "v1.0";

const CONSENT_TEXT = [
  "本據點蒐集之個人資料，將依據點實際業務需要，用於長者服務、聯絡、健康紀錄、課程與活動管理及相關行政作業。",
  "個人資料之使用範圍應以實際業務需要為限，並依相關法規及據點內部資料管理制度辦理。",
  "如需變更或撤回同意，應依據點提供之程序辦理。",
];

const CONSENT_CANVAS_WIDTH = 794;
const CONSENT_CANVAS_HEIGHT = 1123;

export default function ElderProfile({
  elder,
}: Props) {
  const [records, setRecords] =
    useState<HealthRecord[]>([]);

  const [openModal, setOpenModal] =
    useState(false);

  const [editingRecord, setEditingRecord] =
    useState<HealthRecord | null>(null);

  const [
    consentRecord,
    setConsentRecord,
  ] =
    useState<PersonalConsentRecord | null>(
      null
    );

  const [
    consentChecked,
    setConsentChecked,
  ] = useState(false);

  const [
    isDrawing,
    setIsDrawing,
  ] = useState(false);

  const [
    hasSignature,
    setHasSignature,
  ] = useState(false);

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const storageKey = useMemo(() => {
    if (!elder) {
      return null;
    }

    return `health-records-${elder.id}`;
  }, [elder]);

  useEffect(() => {
    if (!storageKey) {
      setRecords([]);
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          storageKey
        );

      if (!saved) {
        setRecords([]);
        return;
      }

      const parsed =
        JSON.parse(saved) as HealthRecord[];

      setRecords(
        Array.isArray(parsed)
          ? parsed
          : []
      );
    } catch (error) {
      console.error(
        "讀取健康紀錄失敗：",
        error
      );

      setRecords([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    if (records.length === 0) {
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(records)
    );
  }, [records, storageKey]);

  useEffect(() => {
    if (!elder) {
      setConsentRecord(null);
      setConsentChecked(false);
      setHasSignature(false);
      clearSignatureCanvas();
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          PERSONAL_CONSENT_STORAGE_KEY
        );

      if (!saved) {
        setConsentRecord(null);
        setConsentChecked(false);
        setHasSignature(false);
        clearSignatureCanvas();
        return;
      }

      const parsed =
        JSON.parse(saved) as Record<
          string,
          PersonalConsentRecord
        >;

      const current =
        parsed[String(elder.id)];

      if (!current) {
        setConsentRecord(null);
        setConsentChecked(false);
        setHasSignature(false);
        clearSignatureCanvas();
        return;
      }

      setConsentRecord(current);
      setConsentChecked(
        current.agreed === true
      );
      setHasSignature(
        Boolean(
          current.signatureDataUrl
        )
      );

      const savedSignature =
        current.signatureDataUrl;

      if (savedSignature) {
        window.requestAnimationFrame(
          () => {
            restoreSignature(
              savedSignature
            );
          }
        );
      } else {
        clearSignatureCanvas();
      }
    } catch (error) {
      console.error(
        "讀取個資同意紀錄失敗：",
        error
      );

      setConsentRecord(null);
      setConsentChecked(false);
      setHasSignature(false);
      clearSignatureCanvas();
    }
  }, [elder]);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    const dpr =
      window.devicePixelRatio || 1;

    const width =
      canvas.clientWidth || 700;

    const height =
      canvas.clientHeight || 220;

    canvas.width =
      width * dpr;

    canvas.height =
      height * dpr;

    context.scale(dpr, dpr);

    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";

    context.clearRect(
      0,
      0,
      width,
      height
    );

    if (
      consentRecord?.signatureDataUrl
    ) {
      restoreSignature(
        consentRecord.signatureDataUrl
      );
    }
  }, [consentRecord?.signatureDataUrl]);

  const latestRecord = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    return [...records].sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    )[0];
  }, [records]);

  const age = useMemo(() => {
    if (!elder) {
      return "-";
    }

    const today = new Date();

    const birthday = new Date(
      elder.birthday
    );

    let years =
      today.getFullYear() -
      birthday.getFullYear();

    const month =
      today.getMonth() -
      birthday.getMonth();

    if (
      month < 0 ||
      (month === 0 &&
        today.getDate() <
          birthday.getDate())
    ) {
      years--;
    }

    return years;
  }, [elder]);

  const bmi = useMemo(() => {
    if (!latestRecord) {
      return "-";
    }

    if (
      latestRecord.height === null ||
      latestRecord.weight === null
    ) {
      return "-";
    }

    if (
      latestRecord.height <= 0 ||
      latestRecord.weight <= 0
    ) {
      return "-";
    }

    const height =
      latestRecord.height / 100;

    if (height <= 0) {
      return "-";
    }

    return (
      latestRecord.weight /
      (height * height)
    ).toFixed(1);
  }, [latestRecord]);

  const handleDelete = (
    id: number
  ) => {
    const updated =
      records.filter(
        (record) =>
          record.id !== id
      );

    setRecords(updated);

    notifyStorageChanged();
  };

  const handleEdit = (
    record: HealthRecord
  ) => {
    setEditingRecord(record);
    setOpenModal(true);
  };

  const getCanvasPoint = (
    event:
      React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        event.clientX -
        rect.left,
      y:
        event.clientY -
        rect.top,
    };
  };

  const handlePointerDown = (
    event:
      React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas =
      canvasRef.current;

    const context =
      canvas?.getContext("2d");

    const point =
      getCanvasPoint(event);

    if (
      !canvas ||
      !context ||
      !point
    ) {
      return;
    }

    canvas.setPointerCapture(
      event.pointerId
    );

    context.beginPath();

    context.moveTo(
      point.x,
      point.y
    );

    setIsDrawing(true);
    setHasSignature(true);
  };

  const handlePointerMove = (
    event:
      React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) {
      return;
    }

    const canvas =
      canvasRef.current;

    const context =
      canvas?.getContext("2d");

    const point =
      getCanvasPoint(event);

    if (
      !canvas ||
      !context ||
      !point
    ) {
      return;
    }

    context.lineTo(
      point.x,
      point.y
    );

    context.stroke();
  };

  const handlePointerUp = (
    event:
      React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas =
      canvasRef.current;

    if (
      canvas?.hasPointerCapture(
        event.pointerId
      )
    ) {
      canvas.releasePointerCapture(
        event.pointerId
      );
    }

    setIsDrawing(false);
  };

  const clearSignature = () => {
    clearSignatureCanvas();
    setHasSignature(false);
  };

  const clearSignatureCanvas =
    () => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      const context =
        canvas.getContext("2d");

      if (!context) {
        return;
      }

      const dpr =
        window.devicePixelRatio || 1;

      const width =
        canvas.width / dpr;

      const height =
        canvas.height / dpr;

      context.clearRect(
        0,
        0,
        width,
        height
      );

      context.lineWidth = 2.5;
      context.lineCap =
        "round";
      context.lineJoin =
        "round";
      context.strokeStyle =
        "#111827";
    };

  const restoreSignature = (
    dataUrl: string
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    const image =
      new Image();

    image.onload = () => {
      const dpr =
        window.devicePixelRatio || 1;

      const width =
        canvas.width / dpr;

      const height =
        canvas.height / dpr;

      context.clearRect(
        0,
        0,
        width,
        height
      );

      context.drawImage(
        image,
        0,
        0,
        width,
        height
      );

      context.lineWidth = 2.5;
      context.lineCap =
        "round";
      context.lineJoin =
        "round";
      context.strokeStyle =
        "#111827";
    };

    image.src = dataUrl;
  };

  const getSignatureDataUrl = () => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return null;
    }

    if (!hasSignature) {
      return null;
    }

    return canvas.toDataURL(
      "image/png"
    );
  };

  const handleSaveConsent = () => {
    if (!elder) {
      return;
    }

    if (!consentChecked) {
      alert(
        "請先勾選「本人已閱讀並同意個資告知事項」。"
      );
      return;
    }

    const signatureDataUrl =
      getSignatureDataUrl();

    if (!signatureDataUrl) {
      alert(
        "請請長者本人在下方完成簽名後再儲存。"
      );
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          PERSONAL_CONSENT_STORAGE_KEY
        );

      let consentMap: Record<
        string,
        PersonalConsentRecord
      > = {};

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (
          parsed &&
          typeof parsed ===
            "object"
        ) {
          consentMap = parsed;
        }
      }

      const now =
        new Date().toISOString();

      const newRecord: PersonalConsentRecord =
        {
          elderId:
            elder.id,
          agreed: true,
          agreedAt: now,
          version:
            PERSONAL_CONSENT_VERSION,
          signatureDataUrl,
          signedAt: now,
        };

      consentMap[
        String(elder.id)
      ] = newRecord;

      localStorage.setItem(
        PERSONAL_CONSENT_STORAGE_KEY,
        JSON.stringify(
          consentMap
        )
      );

      setConsentRecord(
        newRecord
      );

      notifyStorageChanged();

      alert(
        "個資同意、簽名與時間紀錄已儲存。"
      );
    } catch (error) {
      console.error(
        "儲存個資同意紀錄失敗：",
        error
      );

      alert(
        "儲存個資同意紀錄失敗，請稍後再試。"
      );
    }
  };

  const handleWithdrawConsent = () => {
    if (!elder) {
      return;
    }

    const confirmed =
      window.confirm(
        "確定要撤回這位長者目前的個資同意紀錄嗎？"
      );

    if (!confirmed) {
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          PERSONAL_CONSENT_STORAGE_KEY
        );

      let consentMap: Record<
        string,
        PersonalConsentRecord
      > = {};

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (
          parsed &&
          typeof parsed ===
            "object"
        ) {
          consentMap = parsed;
        }
      }

      const withdrawnRecord: PersonalConsentRecord =
        {
          elderId:
            elder.id,
          agreed: false,
          agreedAt: null,
          version:
            PERSONAL_CONSENT_VERSION,
          signatureDataUrl: null,
          signedAt: null,
        };

      consentMap[
        String(elder.id)
      ] = withdrawnRecord;

      localStorage.setItem(
        PERSONAL_CONSENT_STORAGE_KEY,
        JSON.stringify(
          consentMap
        )
      );

      setConsentRecord(
        withdrawnRecord
      );

      setConsentChecked(false);

      clearSignature();

      notifyStorageChanged();
    } catch (error) {
      console.error(
        "撤回個資同意失敗：",
        error
      );

      alert(
        "撤回個資同意失敗，請稍後再試。"
      );
    }
  };

  const handleDownloadConsent = async () => {
    if (
      !elder ||
      !consentRecord?.agreed
    ) {
      return;
    }

    try {
      const imageDataUrl =
        await createConsentImageDataUrl(
          elder,
          consentRecord
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = imageDataUrl;

      link.download = `SilverCare_個資同意書_${elder.name}.png`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();
    } catch (error) {
      console.error(
        "下載個資同意書失敗：",
        error
      );

      alert(
        "下載個資同意書失敗，請稍後再試。"
      );
    }
  };

  const handlePrintConsent = async () => {
    if (
      !elder ||
      !consentRecord?.agreed
    ) {
      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=1200"
      );

    if (!printWindow) {
      alert(
        "瀏覽器阻擋了列印視窗，請允許此頁面開啟新視窗後再試。"
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="zh-Hant">
        <head>
          <meta charset="UTF-8" />
          <title>
            SilverCare 個資同意書
          </title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }

            html,
            body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              background: #fff;
              overflow: hidden;
            }

            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }

            img {
              display: block;
              width: 210mm;
              height: 297mm;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div>
            正在產生列印文件...
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    try {
      const imageDataUrl =
        await createConsentImageDataUrl(
          elder,
          consentRecord
        );

      printWindow.document.body.innerHTML = `
        <img
          src="${imageDataUrl}"
          alt="SilverCare 個資同意書"
        />
      `;

      const image =
        printWindow.document.querySelector(
          "img"
        );

      if (image) {
        image.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        if (
          image.complete
        ) {
          printWindow.focus();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error(
        "建立列印文件失敗：",
        error
      );

      printWindow.close();

      alert(
        "建立列印文件失敗，請稍後再試。"
      );
    }
  };

  const formatConsentDate = (
    value: string | null
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "zh-TW"
    );
  };

  if (!elder) {
    return (
      <div
        style={{
          flex: 1,
          background: "#fff",
          borderRadius:
            radius.lg,
          boxShadow:
            shadow.md,
          display: "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          color:
            colors.textLight,
          fontSize: 16,
        }}
      >
        請先選擇一位長者
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          flex: 1,
          background: "#fff",
          borderRadius:
            radius.lg,
          boxShadow:
            shadow.md,
          padding: 24,
          display: "flex",
          flexDirection:
            "column",
          gap: 24,
          overflowY: "auto",
        }}
      >
        {/* ==================== */}
        {/* Elder Header */}
        {/* ==================== */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color:
                  colors.primary,
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              {elder.name}
            </h2>

            <div
              style={{
                marginTop: 8,
                color:
                  colors.textLight,
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              <div>
                性別：
                {elder.gender}
              </div>

              <div>
                生日：
                {elder.birthday}
              </div>

              <div>
                年齡：
                {age} 歲
              </div>

              <div>
                電話：
                {elder.phone}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingRecord(
                null
              );
              setOpenModal(true);
            }}
            style={{
              background:
                colors.primary,
              color: "#fff",
              border: "none",
              borderRadius:
                radius.md,
              padding:
                "10px 18px",
              cursor:
                "pointer",
              fontWeight: 600,
            }}
          >
            ＋ 新增健康紀錄
          </button>
        </div>

        {/* ==================== */}
        {/* Health Summary */}
        {/* ==================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#F7FAFC",
              borderRadius:
                radius.md,
              padding: 18,
            }}
          >
            <div
              style={{
                color:
                  colors.textLight,
                fontSize: 13,
              }}
            >
              身高
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 700,
                color:
                  colors.primary,
              }}
            >
              {latestRecord &&
              latestRecord.height !==
                null
                ? `${latestRecord.height} cm`
                : "-"}
            </div>
          </div>

          <div
            style={{
              background: "#F7FAFC",
              borderRadius:
                radius.md,
              padding: 18,
            }}
          >
            <div
              style={{
                color:
                  colors.textLight,
                fontSize: 13,
              }}
            >
              體重
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 700,
                color:
                  colors.primary,
              }}
            >
              {latestRecord &&
              latestRecord.weight !==
                null
                ? `${latestRecord.weight} kg`
                : "-"}
            </div>
          </div>

          <div
            style={{
              background: "#F7FAFC",
              borderRadius:
                radius.md,
              padding: 18,
            }}
          >
            <div
              style={{
                color:
                  colors.textLight,
                fontSize: 13,
              }}
            >
              BMI
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 700,
                color:
                  colors.primary,
              }}
            >
              {bmi}
            </div>
          </div>

          <div
            style={{
              background: "#F7FAFC",
              borderRadius:
                radius.md,
              padding: 18,
            }}
          >
            <div
              style={{
                color:
                  colors.textLight,
                fontSize: 13,
              }}
            >
              最新血壓
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 24,
                fontWeight: 700,
                color:
                  colors.primary,
              }}
            >
              {latestRecord
                ? `${latestRecord.systolic}/${latestRecord.diastolic}`
                : "-"}
            </div>

            <div
              style={{
                marginTop: 6,
                color:
                  colors.textLight,
                fontSize: 13,
              }}
            >
              {latestRecord
                ? `脈搏 ${latestRecord.pulse} bpm`
                : ""}
            </div>
          </div>
        </div>

        {/* ==================== */}
        {/* Personal Consent */}
        {/* ==================== */}

        <div
          style={{
            background: "#fff",
            borderRadius:
              radius.md,
            border:
              "1px solid #E5E7EB",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap: 16,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color:
                    colors.primary,
                  fontSize: 22,
                }}
              >
                📄 個資告知與同意
              </h3>

              <p
                style={{
                  margin:
                    "8px 0 0",
                  color:
                    colors.textLight,
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                本畫面提供個資告知、本人同意、手寫簽名、保存、下載與列印功能。
              </p>
            </div>

            <div
              style={{
                display:
                  "inline-flex",
                alignItems:
                  "center",
                padding:
                  "6px 12px",
                borderRadius:
                  999,
                background:
                  consentRecord?.agreed
                    ? "#DCFCE7"
                    : "#FEE2E2",
                color:
                  consentRecord?.agreed
                    ? "#166534"
                    : "#991B1B",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {consentRecord?.agreed
                ? "已同意"
                : "尚未同意"}
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 18,
              background:
                "#F8FAFC",
              borderRadius:
                radius.md,
              lineHeight: 1.8,
              color: "#374151",
              fontSize: 14,
            }}
          >
            <strong>
              個人資料告知事項
            </strong>

            {CONSENT_TEXT.map(
              (paragraph, index) => (
                <p
                  key={index}
                  style={{
                    margin:
                      "10px 0 0",
                  }}
                >
                  {paragraph}
                </p>
              )
            )}
          </div>

          <label
            style={{
              display:
                "flex",
              alignItems:
                "flex-start",
              gap: 10,
              marginTop: 20,
              cursor:
                "pointer",
              lineHeight: 1.6,
              color:
                "#374151",
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={
                consentChecked
              }
              onChange={(event) =>
                setConsentChecked(
                  event.target
                    .checked
                )
              }
              style={{
                marginTop: 3,
              }}
            />

            <span>
              本人已閱讀上述個人資料告知事項，並同意據點依告知內容使用相關個人資料。
            </span>
          </label>

          {/* ==================== */}
          {/* Signature */}
          {/* ==================== */}

          <div
            style={{
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: 12,
                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color:
                      colors.primary,
                  }}
                >
                  ✍️ 長者本人簽名
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color:
                      colors.textLight,
                    fontSize: 13,
                  }}
                >
                  請使用手機、平板觸控筆、手指或滑鼠簽名。
                </div>
              </div>

              <button
                type="button"
                onClick={
                  clearSignature
                }
                style={{
                  border:
                    "1px solid #D1D5DB",
                  background:
                    "#fff",
                  color:
                    "#374151",
                  borderRadius:
                    radius.md,
                  padding:
                    "8px 14px",
                  cursor:
                    "pointer",
                  fontWeight: 600,
                }}
              >
                清除簽名
              </button>
            </div>

            <div
              style={{
                marginTop: 12,
                border:
                  "1px solid #CBD5E1",
                borderRadius:
                  radius.md,
                background:
                  "#fff",
                overflow:
                  "hidden",
                touchAction:
                  "none",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width:
                    "100%",
                  height: 220,
                  display:
                    "block",
                  cursor:
                    "crosshair",
                  touchAction:
                    "none",
                }}
                onPointerDown={
                  handlePointerDown
                }
                onPointerMove={
                  handlePointerMove
                }
                onPointerUp={
                  handlePointerUp
                }
                onPointerCancel={
                  handlePointerUp
                }
              />
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color:
                  hasSignature
                    ? "#166534"
                    : "#B45309",
              }}
            >
              {hasSignature
                ? "已偵測到簽名"
                : "尚未簽名"}
            </div>
          </div>

          {/* ==================== */}
          {/* Saved Record */}
          {/* ==================== */}

          {consentRecord && (
            <div
              style={{
                marginTop: 20,
                padding: 14,
                background:
                  "#F9FAFB",
                borderRadius:
                  radius.md,
                color:
                  colors.textLight,
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              <div>
                同意狀態：
                {consentRecord.agreed
                  ? "已同意"
                  : "已撤回"}
              </div>

              <div>
                同意日期：
                {formatConsentDate(
                  consentRecord.agreedAt
                )}
              </div>

              <div>
                簽名時間：
                {formatConsentDate(
                  consentRecord.signedAt
                )}
              </div>

              <div>
                文件版本：
                {
                  consentRecord.version
                }
              </div>
            </div>
          )}

          {/* ==================== */}
          {/* Actions */}
          {/* ==================== */}

          <div
            style={{
              display:
                "flex",
              gap: 10,
              marginTop: 20,
              flexWrap:
                "wrap",
            }}
          >
            <button
              type="button"
              onClick={
                handleSaveConsent
              }
              style={{
                background:
                  colors.primary,
                color: "#fff",
                border: "none",
                borderRadius:
                  radius.md,
                padding:
                  "10px 18px",
                cursor:
                  "pointer",
                fontWeight: 700,
              }}
            >
              儲存同意與簽名
            </button>

            {consentRecord?.agreed && (
              <>
                <button
                  type="button"
                  onClick={
                    handleDownloadConsent
                  }
                  style={{
                    background:
                      "#fff",
                    color:
                      colors.primary,
                    border:
                      `1px solid ${colors.primary}`,
                    borderRadius:
                      radius.md,
                    padding:
                      "10px 18px",
                    cursor:
                      "pointer",
                    fontWeight: 600,
                  }}
                >
                  📥 下載 PNG 同意書
                </button>

                <button
                  type="button"
                  onClick={
                    handlePrintConsent
                  }
                  style={{
                    background:
                      "#fff",
                    color:
                      "#374151",
                    border:
                      "1px solid #D1D5DB",
                    borderRadius:
                      radius.md,
                    padding:
                      "10px 18px",
                    cursor:
                      "pointer",
                    fontWeight: 600,
                  }}
                >
                  🖨️ 列印 A4
                </button>

                <button
                  type="button"
                  onClick={
                    handleWithdrawConsent
                  }
                  style={{
                    background:
                      "#fff",
                    color:
                      "#B91C1C",
                    border:
                      "1px solid #FCA5A5",
                    borderRadius:
                      radius.md,
                    padding:
                      "10px 18px",
                    cursor:
                      "pointer",
                    fontWeight: 600,
                  }}
                >
                  撤回目前同意
                </button>
              </>
            )}
          </div>
        </div>

        {/* ==================== */}
        {/* Health Records */}
        {/* ==================== */}

<HealthTrendChart
  records={records}
/>
        <HealthRecordTable
          records={records}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* ==================== */}
      {/* Health Record Modal */}
      {/* ==================== */}

      <AddHealthRecordModal
        open={openModal}
        editingRecord={
          editingRecord
        }
        onClose={() => {
          setOpenModal(false);
          setEditingRecord(
            null
          );
        }}
        onSave={(record) => {
          let updatedRecords: HealthRecord[];

          if (editingRecord) {
            updatedRecords =
              records.map(
                (item) =>
                  item.id ===
                  editingRecord.id
                    ? {
                        ...editingRecord,
                        ...record,
                      }
                    : item
              );
          } else {
            const newRecord: HealthRecord =
              {
                id: Date.now(),
                ...record,
              };

            updatedRecords = [
              newRecord,
              ...records,
            ];
          }

          setRecords(
            updatedRecords
          );

          notifyStorageChanged();

          setEditingRecord(
            null
          );

          setOpenModal(false);
        }}
      />
    </>
  );
}

async function createConsentImageDataUrl(
  elder: Elder,
  consentRecord: PersonalConsentRecord
) {
  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    CONSENT_CANVAS_WIDTH;

  canvas.height =
    CONSENT_CANVAS_HEIGHT;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "無法建立文件畫布。"
    );
  }

  context.fillStyle =
    "#ffffff";

  context.fillRect(
    0,
    0,
    CONSENT_CANVAS_WIDTH,
    CONSENT_CANVAS_HEIGHT
  );

  const margin = 64;

  let y = 72;

  context.fillStyle =
    "#163A43";

  context.font =
    'bold 28px "Microsoft JhengHei", sans-serif';

  context.textAlign =
    "center";

  context.fillText(
    "SilverCare 個人資料告知與同意書",
    CONSENT_CANVAS_WIDTH / 2,
    y
  );

  y += 54;

  context.textAlign =
    "left";

  drawLine(
    context,
    margin,
    y,
    CONSENT_CANVAS_WIDTH -
      margin,
    y,
    "#CBD5E1"
  );

  y += 34;

  context.fillStyle =
    "#163A43";

  context.font =
    'bold 18px "Microsoft JhengHei", sans-serif';

  context.fillText(
    "一、長者基本資料",
    margin,
    y
  );

  y += 34;

  context.font =
    '14px "Microsoft JhengHei", sans-serif';

  context.fillStyle =
    "#374151";

  y = drawText(
    context,
    `姓名：${safeText(
      elder.name
    )}`,
    margin,
    y,
    666,
    24
  );

  y = drawText(
    context,
    `性別：${safeText(
      elder.gender
    )}`,
    margin,
    y,
    666,
    24
  );

  y = drawText(
    context,
    `生日：${safeText(
      elder.birthday
    )}`,
    margin,
    y,
    666,
    24
  );

  y = drawText(
    context,
    `電話：${safeText(
      elder.phone
    )}`,
    margin,
    y,
    666,
    24
  );

  y += 16;

  context.fillStyle =
    "#163A43";

  context.font =
    'bold 18px "Microsoft JhengHei", sans-serif';

  context.fillText(
    "二、個人資料告知事項",
    margin,
    y
  );

  y += 34;

  context.font =
    '14px "Microsoft JhengHei", sans-serif';

  context.fillStyle =
    "#374151";

  CONSENT_TEXT.forEach(
    (paragraph) => {
      y = drawText(
        context,
        paragraph,
        margin,
        y,
        666,
        24
      );

      y += 8;
    }
  );

  y += 8;

  context.fillStyle =
    "#163A43";

  context.font =
    'bold 18px "Microsoft JhengHei", sans-serif';

  context.fillText(
    "三、本人同意",
    margin,
    y
  );

  y += 34;

  context.fillStyle =
    "#374151";

  context.font =
    '14px "Microsoft JhengHei", sans-serif';

  y = drawText(
    context,
    "☑ 本人已閱讀上述個人資料告知事項，並同意據點依告知內容使用相關個人資料。",
    margin,
    y,
    666,
    24
  );

  y += 18;

  context.fillStyle =
    "#163A43";

  context.font =
    'bold 18px "Microsoft JhengHei", sans-serif';

  context.fillText(
    "四、長者本人電子簽名",
    margin,
    y
  );

  y += 20;

  drawRoundedRect(
    context,
    margin,
    y,
    666,
    170,
    12,
    "#F8FAFC",
    "#CBD5E1"
  );

  if (
    consentRecord.signatureDataUrl
  ) {
    const signatureImage =
      await loadImage(
        consentRecord.signatureDataUrl
      );

    const maxWidth = 600;
    const maxHeight = 125;

    const ratio =
      Math.min(
        maxWidth /
          signatureImage.width,
        maxHeight /
          signatureImage.height
      );

    const width =
      signatureImage.width *
      ratio;

    const height =
      signatureImage.height *
      ratio;

    context.drawImage(
      signatureImage,
      margin +
        (666 - width) / 2,
      y +
        (170 - height) / 2,
      width,
      height
    );
  }

  y += 194;

  context.fillStyle =
    "#374151";

  context.font =
    '13px "Microsoft JhengHei", sans-serif';

  y = drawText(
    context,
    `同意日期：${formatDocumentDate(
      consentRecord.agreedAt
    )}`,
    margin,
    y,
    666,
    22
  );

  y = drawText(
    context,
    `簽名時間：${formatDocumentDate(
      consentRecord.signedAt
    )}`,
    margin,
    y,
    666,
    22
  );

  y = drawText(
    context,
    `文件版本：${safeText(
      consentRecord.version
    )}`,
    margin,
    y,
    666,
    22
  );

  const footerY =
    CONSENT_CANVAS_HEIGHT -
    46;

  drawLine(
    context,
    margin,
    footerY - 18,
    CONSENT_CANVAS_WIDTH -
      margin,
    footerY - 18,
    "#E5E7EB"
  );

  context.fillStyle =
    "#6B7280";

  context.font =
    '11px "Microsoft JhengHei", sans-serif';

  context.textAlign =
    "center";

  context.fillText(
    "SilverCare 系統產生文件",
    CONSENT_CANVAS_WIDTH / 2,
    footerY
  );

  context.textAlign =
    "left";

  return canvas.toDataURL(
    "image/png"
  );
}

function loadImage(
  dataUrl: string
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image();

      image.onload = () =>
        resolve(image);

      image.onerror = () =>
        reject(
          new Error(
            "無法載入簽名圖片。"
          )
        );

      image.src = dataUrl;
    }
  );
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const characters =
    Array.from(text);

  let line = "";

  let currentY = y;

  characters.forEach(
    (character) => {
      const testLine =
        line + character;

      const metrics =
        context.measureText(
          testLine
        );

      if (
        metrics.width >
          maxWidth &&
        line
      ) {
        context.fillText(
          line,
          x,
          currentY
        );

        line = character;

        currentY +=
          lineHeight;
      } else {
        line =
          testLine;
      }
    }
  );

  if (line) {
    context.fillText(
      line,
      x,
      currentY
    );

    currentY +=
      lineHeight;
  }

  return currentY;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radiusValue: number,
  fillColor: string,
  strokeColor: string
) {
  const radiusValueSafe =
    Math.min(
      radiusValue,
      width / 2,
      height / 2
    );

  context.beginPath();

  context.moveTo(
    x + radiusValueSafe,
    y
  );

  context.lineTo(
    x +
      width -
      radiusValueSafe,
    y
  );

  context.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + radiusValueSafe
  );

  context.lineTo(
    x + width,
    y +
      height -
      radiusValueSafe
  );

  context.quadraticCurveTo(
    x + width,
    y + height,
    x +
      width -
      radiusValueSafe,
    y + height
  );

  context.lineTo(
    x + radiusValueSafe,
    y + height
  );

  context.quadraticCurveTo(
    x,
    y + height,
    x,
    y +
      height -
      radiusValueSafe
  );

  context.lineTo(
    x,
    y + radiusValueSafe
  );

  context.quadraticCurveTo(
    x,
    y,
    x +
      radiusValueSafe,
    y
  );

  context.closePath();

  context.fillStyle =
    fillColor;

  context.fill();

  context.strokeStyle =
    strokeColor;

  context.stroke();
}

function drawLine(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
) {
  context.beginPath();

  context.moveTo(
    x1,
    y1
  );

  context.lineTo(
    x2,
    y2
  );

  context.strokeStyle =
    color;

  context.lineWidth = 1;

  context.stroke();
}

function safeText(
  value:
    | string
    | null
    | undefined
) {
  return value ?? "";
}

function formatDocumentDate(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "zh-TW"
  );
}