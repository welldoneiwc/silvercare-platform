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
          桌機版：原本的表格
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
          手機版：緊湊條列式
         ========================= */}
      <div className="health-record-mobile">
        {records.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 8px",
              color: colors.textLight,
            }}
          >
            尚無健康紀錄
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="health-record-row"
            >
              {/* 第一列 */}
              <div className="health-record-main-row">
                <div className="health-record-date">
                  {record.date}
                </div>

                <div className="health-record-value">
                  <span>血壓</span>
                  <strong>
                    {record.systolic}/
                    {record.diastolic}
                  </strong>
                </div>

                <div className="health-record-value pulse">
                  <span>脈搏</span>
                  <strong>
                    {record.pulse}
                  </strong>
                </div>

                {showActions && (
                  <div className="health-record-actions">
                    <ActionButtons
                      record={record}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                )}
              </div>

              {/* 第二列 */}
              <div className="health-record-sub-row">
                <div>
                  <span>身高</span>
                  <strong>
                    {record.height &&
                    record.height > 0
                      ? `${record.height} cm`
                      : "-"}
                  </strong>
                </div>

                <div>
                  <span>體重</span>
                  <strong>
                    {record.weight &&
                    record.weight > 0
                      ? `${record.weight} kg`
                      : "-"}
                  </strong>
                </div>

                <div>
                  <span>BMI</span>
                  <strong>
                    {calculateBMI(record)}
                  </strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .health-record-mobile {
          display: none;
        }

        .health-record-desktop {
          display: block;
        }

        @media (max-width: 640px) {
          .health-record-desktop {
            display: none;
          }

          .health-record-mobile {
            display: block;
            width: 100%;
          }

          .health-record-row {
            width: 100%;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
            box-sizing: border-box;
          }

          .health-record-row:last-child {
            border-bottom: none;
          }

          .health-record-main-row {
            display: flex;
            align-items: center;
            width: 100%;
            gap: 10px;
            min-width: 0;
          }

          .health-record-date {
            font-size: 14px;
            font-weight: 600;
            color: #334155;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .health-record-value {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 42px;
          }

          .health-record-value span,
          .health-record-sub-row span {
            font-size: 11px;
            color: #64748b;
          }

          .health-record-value strong,
          .health-record-sub-row strong {
            font-size: 14px;
            color: #334155;
            font-weight: 600;
            white-space: nowrap;
          }

          .health-record-actions {
            display: flex;
            margin-left: auto;
            flex-shrink: 0;
          }

          .health-record-sub-row {
            display: flex;
            align-items: center;
            gap: 24px;
            padding-top: 8px;
            padding-left: 0;
          }

          .health-record-sub-row > div {
            display: flex;
            align-items: baseline;
            gap: 5px;
          }
        }

        @media (max-width: 420px) {
          .health-record-main-row {
            gap: 7px;
          }

          .health-record-date {
            font-size: 13px;
          }

          .health-record-value {
            min-width: 38px;
          }

          .health-record-value strong,
          .health-record-sub-row strong {
            font-size: 13px;
          }

          .health-record-sub-row {
            gap: 14px;
          }
        }
      `}</style>
    </div>
  );
}

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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(record)}
          style={{
            background: "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: radius.sm,
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          編輯
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => {
            if (
              confirm(
                "確定要刪除此筆健康紀錄嗎？"
              )
            ) {
              onDelete(record.id);
            }
          }}
          style={{
            background: "#DC2626",
            color: "#fff",
            border: "none",
            borderRadius: radius.sm,
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          刪除
        </button>
      )}
    </div>
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