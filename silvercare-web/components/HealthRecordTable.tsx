"use client";

import { HealthRecord } from "./ElderProfile";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";

type Props = {
  records: HealthRecord[];
  onEdit?: (record: HealthRecord) => void;
  onDelete?: (id: number) => void;
};

function calculateBMI(record: HealthRecord) {
  const hasHeight =
    record.height !== null && record.height > 0;

  const hasWeight =
    record.weight !== null && record.weight > 0;

  if (!hasHeight || !hasWeight) {
    return "-";
  }

  return (
    record.weight! /
    Math.pow(record.height! / 100, 2)
  ).toFixed(1);
}

export default function HealthRecordTable({
  records,
  onEdit,
  onDelete,
}: Props) {
  const showActions =
    Boolean(onEdit) || Boolean(onDelete);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: radius.lg,
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* 標題 */}
      <div
        style={{
          paddingBottom: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            color: colors.primary,
          }}
        >
          健康紀錄
        </h3>
      </div>

      {/* =========================
          桌機版
         ========================= */}
      <div className="health-record-desktop">
        <div
          style={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: showActions ? 720 : 620,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#F7FAFC",
                }}
              >
                <th style={thStyle}>日期</th>
                <th style={thStyle}>血壓</th>
                <th style={thStyle}>脈搏</th>
                <th style={thStyle}>身高</th>
                <th style={thStyle}>體重</th>
                <th style={thStyle}>BMI</th>

                {showActions && (
                  <th style={thStyle}>
                    操作
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={showActions ? 7 : 6}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: colors.textLight,
                    }}
                  >
                    尚無健康紀錄
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td style={tdStyle}>
                      {record.date}
                    </td>

                    <td style={tdStyle}>
                      {record.systolic}/
                      {record.diastolic}
                    </td>

                    <td style={tdStyle}>
                      {record.pulse}
                    </td>

                    <td style={tdStyle}>
                      {record.height &&
                      record.height > 0
                        ? `${record.height} cm`
                        : "-"}
                    </td>

                    <td style={tdStyle}>
                      {record.weight &&
                      record.weight > 0
                        ? `${record.weight} kg`
                        : "-"}
                    </td>

                    <td style={tdStyle}>
                      {calculateBMI(record)}
                    </td>

                    {showActions && (
                      <td style={tdStyle}>
                        <ActionButtons
                          record={record}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          手機版
          條列式表格
         ========================= */}
      <div className="health-record-mobile">
        <div className="mobile-table">

          {/* 表頭 */}
          <div
            className={`mobile-table-header ${
              showActions
                ? "with-actions"
                : "without-actions"
            }`}
          >
            <div>日期</div>
            <div>血壓</div>
            <div>脈搏</div>
            <div>身高</div>
            <div>體重</div>
            <div>BMI</div>

            {showActions && (
              <div>操作</div>
            )}
          </div>

          {/* 資料 */}
          {records.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "28px 8px",
                color: colors.textLight,
                fontSize: 14,
              }}
            >
              尚無健康紀錄
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className={`mobile-table-row ${
                  showActions
                    ? "with-actions"
                    : "without-actions"
                }`}
              >
                {/* 日期 */}
                <div className="date-cell">
                  {formatMobileDate(record.date)}
                </div>

                {/* 血壓 */}
                <div className="number-cell">
                  {record.systolic}/
                  {record.diastolic}
                </div>

                {/* 脈搏 */}
                <div className="number-cell">
                  {record.pulse}
                </div>

                {/* 身高 */}
                <div className="number-cell">
                  {record.height &&
                  record.height > 0 ? (
                    <>
                      <span>
                        {record.height}
                      </span>
                      <small>cm</small>
                    </>
                  ) : (
                    "-"
                  )}
                </div>

                {/* 體重 */}
                <div className="number-cell">
                  {record.weight &&
                  record.weight > 0 ? (
                    <>
                      <span>
                        {record.weight}
                      </span>
                      <small>kg</small>
                    </>
                  ) : (
                    "-"
                  )}
                </div>

                {/* BMI */}
                <div className="number-cell">
                  {calculateBMI(record)}
                </div>

                {/* 操作 */}
                {showActions && (
                  <div className="mobile-actions">
                    <ActionButtons
                      record={record}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .health-record-desktop {
          display: block;
        }

        .health-record-mobile {
          display: none;
        }

        /* =========================
           手機版
           ========================= */
        @media (max-width: 640px) {
          .health-record-desktop {
            display: none;
          }

          .health-record-mobile {
            display: block;
            width: 100%;
            min-width: 0;
            overflow: hidden;
          }

          .mobile-table {
            width: 100%;
            min-width: 0;
          }

          .mobile-table-header,
          .mobile-table-row {
            display: grid;
            align-items: center;
            width: 100%;
            box-sizing: border-box;
          }

          /*
            日期 / 血壓 / 脈搏 /
            身高 / 體重 / BMI / 操作
          */
          .mobile-table-header.with-actions,
          .mobile-table-row.with-actions {
            grid-template-columns:
              minmax(78px, 1.35fr)
              minmax(54px, 1fr)
              minmax(40px, 0.72fr)
              minmax(48px, 0.82fr)
              minmax(48px, 0.82fr)
              minmax(40px, 0.7fr)
              46px;
          }

          .mobile-table-header.without-actions,
          .mobile-table-row.without-actions {
            grid-template-columns:
              minmax(78px, 1.35fr)
              minmax(54px, 1fr)
              minmax(40px, 0.72fr)
              minmax(48px, 0.82fr)
              minmax(48px, 0.82fr)
              minmax(40px, 0.7fr);
          }

          .mobile-table-header {
            background: #f7fafc;
            min-height: 48px;
            padding: 8px 3px;
            color: ${colors.primary};
            font-weight: 600;
            font-size: 13px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
          }

          .mobile-table-row {
            min-height: 78px;
            padding: 8px 3px;
            border-bottom: 1px solid #edf0f2;
            color: #334155;
          }

          .mobile-table-row:last-child {
            border-bottom: none;
          }

          .mobile-table-row > div,
          .mobile-table-header > div {
            min-width: 0;
            text-align: center;
          }

          .date-cell {
            font-size: 13px;
            font-weight: 600;
            line-height: 1.35;
            white-space: nowrap;
          }

          .number-cell {
            font-size: 13px;
            font-weight: 500;
            line-height: 1.25;
            white-space: nowrap;
          }

          .number-cell span {
            display: block;
          }

          .number-cell small {
            display: block;
            margin-top: 2px;
            font-size: 11px;
            color: #64748b;
            font-weight: 400;
          }

          /*
            手機操作區
            寬度固定，避免被右側切掉
          */
          .mobile-actions {
            width: 46px;
            min-width: 46px;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          /*
            重要：
            ActionButtons 本身原本是 flex row，
            手機版強制改成上下排列
          */
          .mobile-actions :global(.action-buttons) {
            flex-direction: column !important;
            gap: 3px !important;
            width: 100%;
            align-items: center;
            justify-content: center;
          }

          .mobile-actions :global(.icon-button) {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            flex-shrink: 0;
          }

          .mobile-actions :global(.icon-button svg) {
            width: 14px;
            height: 14px;
          }
        }

        /* =========================
           更小手機
           ========================= */
        @media (max-width: 420px) {
          .mobile-table-header {
            font-size: 12px;
            padding-left: 2px;
            padding-right: 2px;
          }

          .mobile-table-row {
            padding-left: 2px;
            padding-right: 2px;
          }

          .mobile-table-header.with-actions,
          .mobile-table-row.with-actions {
            grid-template-columns:
              minmax(72px, 1.3fr)
              minmax(50px, 1fr)
              minmax(36px, 0.7fr)
              minmax(45px, 0.8fr)
              minmax(45px, 0.8fr)
              minmax(36px, 0.65fr)
              44px;
          }

          .mobile-table-header.without-actions,
          .mobile-table-row.without-actions {
            grid-template-columns:
              minmax(72px, 1.3fr)
              minmax(50px, 1fr)
              minmax(36px, 0.7fr)
              minmax(45px, 0.8fr)
              minmax(45px, 0.8fr)
              minmax(36px, 0.65fr);
          }

          .date-cell {
            font-size: 12px;
          }

          .number-cell {
            font-size: 12px;
          }

          .number-cell small {
            font-size: 10px;
          }

          .mobile-actions {
            width: 44px;
            min-width: 44px;
          }

          .mobile-actions :global(.action-buttons) {
            gap: 2px !important;
          }

          .mobile-actions :global(.icon-button) {
            width: 26px !important;
            height: 26px !important;
            min-width: 26px !important;
          }

          .mobile-actions :global(.icon-button svg) {
            width: 13px;
            height: 13px;
          }
        }
      `}</style>
    </div>
  );
}

/* =========================
   操作按鈕
   桌機：左右排列
   手機：上下排列
   ========================= */
function ActionButtons({
  record,
  onEdit,
  onDelete,
}: {
  record: HealthRecord;
  onEdit?: (record: HealthRecord) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <div
      className="action-buttons"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {onEdit && (
        <button
          type="button"
          aria-label="編輯健康紀錄"
          title="編輯"
          onClick={() => onEdit(record)}
          className="icon-button edit-button"
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            padding: 0,
            border: "none",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            background: "#2563EB",
          }}
        >
          <EditIcon />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          aria-label="刪除健康紀錄"
          title="刪除"
          onClick={() => {
            if (
              confirm(
                "確定要刪除此筆健康紀錄嗎？"
              )
            ) {
              onDelete(record.id);
            }
          }}
          className="icon-button delete-button"
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            padding: 0,
            border: "none",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            background: "#EF3340",
          }}
        >
          <DeleteIcon />
        </button>
      )}
    </div>
  );
}

/* =========================
   手機日期格式
   2026-09-08
   ↓
   09.08.26
   ========================= */
function formatMobileDate(date: string) {
  if (!date) {
    return "-";
  }

  const parts = date.split("-");

  if (parts.length === 3) {
    const year = parts[0].slice(-2);
    const month = parts[1];
    const day = parts[2];

    return `${month}.${day}.${year}`;
  }

  return date;
}

/* =========================
   編輯 Icon
   ========================= */
function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/* =========================
   刪除 Icon
   ========================= */
function DeleteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "center",
  borderBottom: "1px solid #E5E7EB",
  color: colors.primary,
  fontWeight: 600,
  fontSize: 14,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "center",
  borderBottom: "1px solid #F3F4F6",
  fontSize: 14,
  whiteSpace: "nowrap",
};