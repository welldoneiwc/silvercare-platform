"use client";

import { HealthRecord } from "./ElderProfile";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";

type Props = {
  records: HealthRecord[];
  onEdit?: (record: HealthRecord) => void;
  onDelete?: (id: number) => void;
};

export default function HealthRecordTable({
  records,
  onEdit,
  onDelete,
}: Props) {
  const showActions = Boolean(onEdit) || Boolean(onDelete);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: radius.lg,
        overflow: "hidden",
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

      {/* ==================== */}
      {/* 桌機版：表格 */}
      {/* ==================== */}

      <div
        className="health-record-desktop"
        style={{
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
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
                <th
                  style={{
                    ...thStyle,
                    position: "sticky",
                    right: 0,
                    zIndex: 2,
                    background: "#F7FAFC",
                    boxShadow:
                      "-4px 0 8px rgba(0,0,0,0.06)",
                    whiteSpace: "nowrap",
                  }}
                >
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
              records.map((record) => {
                const {
                  hasHeight,
                  hasWeight,
                  bmi,
                } = calculateHealthValues(record);

                return (
                  <tr key={record.id}>
                    <td style={tdStyle}>
                      {record.date}
                    </td>

                    <td style={tdStyle}>
                      {record.systolic}/{record.diastolic}
                    </td>

                    <td style={tdStyle}>
                      {record.pulse}
                    </td>

                    <td style={tdStyle}>
                      {hasHeight
                        ? `${record.height} cm`
                        : "-"}
                    </td>

                    <td style={tdStyle}>
                      {hasWeight
                        ? `${record.weight} kg`
                        : "-"}
                    </td>

                    <td style={tdStyle}>
                      {bmi}
                    </td>

                    {showActions && (
                      <td
                        style={{
                          ...tdStyle,
                          position: "sticky",
                          right: 0,
                          zIndex: 1,
                          background: "#fff",
                          boxShadow:
                            "-4px 0 8px rgba(0,0,0,0.06)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <ActionButtons
                          record={record}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== */}
      {/* 手機版：卡片 */}
      {/* ==================== */}

      <div
        className="health-record-mobile"
        style={{
          display: "none",
        }}
      >
        {records.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              color: colors.textLight,
            }}
          >
            尚無健康紀錄
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {records.map((record) => {
              const {
                hasHeight,
                hasWeight,
                bmi,
              } = calculateHealthValues(record);

              return (
                <div
                  key={record.id}
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: radius.md,
                    padding: 16,
                    background: "#fff",
                  }}
                >
                  {/* 日期 */}
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: colors.primary,
                      marginBottom: 14,
                    }}
                  >
                    {record.date}
                  </div>

                  {/* 健康資料 */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: 12,
                    }}
                  >
                    <MobileField
                      label="血壓"
                      value={`${record.systolic}/${record.diastolic}`}
                    />

                    <MobileField
                      label="脈搏"
                      value={String(record.pulse)}
                    />

                    <MobileField
                      label="身高"
                      value={
                        hasHeight
                          ? `${record.height} cm`
                          : "-"
                      }
                    />

                    <MobileField
                      label="體重"
                      value={
                        hasWeight
                          ? `${record.weight} kg`
                          : "-"
                      }
                    />

                    <MobileField
                      label="BMI"
                      value={bmi}
                    />
                  </div>

                  {/* 操作 */}
                  {showActions && (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop:
                          "1px solid #F3F4F6",
                      }}
                    >
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() =>
                            onEdit(record)
                          }
                          style={{
                            flex: 1,
                            background: "#2563EB",
                            color: "#fff",
                            border: "none",
                            borderRadius: radius.sm,
                            padding: "10px 12px",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 600,
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
                            flex: 1,
                            background: "#DC2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: radius.sm,
                            padding: "10px 12px",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== */}
      {/* RWD */}
      {/* ==================== */}

      <style jsx>{`
        @media (max-width: 640px) {
          .health-record-desktop {
            display: none !important;
          }

          .health-record-mobile {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

function calculateHealthValues(
  record: HealthRecord
) {
  const hasHeight =
    record.height !== null &&
    record.height > 0;

  const hasWeight =
    record.weight !== null &&
    record.weight > 0;

  const bmi =
    hasHeight && hasWeight
      ? (
          record.weight! /
          Math.pow(
            record.height! / 100,
            2
          )
        ).toFixed(1)
      : "-";

  return {
    hasHeight,
    hasWeight,
    bmi,
  };
}

function MobileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: colors.textLight,
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: colors.text,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
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
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
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
            padding: "6px 12px",
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
            padding: "6px 12px",
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