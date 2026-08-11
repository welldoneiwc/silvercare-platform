"use client";

import { HealthRecord } from "./ElderProfile";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";

type Props = {
  records: HealthRecord[];
  onEdit: (
    record: HealthRecord
  ) => void;
  onDelete: (
    id: number
  ) => void;
};

export default function HealthRecordTable({
  records,
  onEdit,
  onDelete,
}: Props) {
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

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#F7FAFC",
            }}
          >
            <th style={thStyle}>
              日期
            </th>

            <th style={thStyle}>
              血壓
            </th>

            <th style={thStyle}>
              脈搏
            </th>

            <th style={thStyle}>
              身高
            </th>

            <th style={thStyle}>
              體重
            </th>

            <th style={thStyle}>
              BMI
            </th>

            <th style={thStyle}>
              操作
            </th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td
                colSpan={7}
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

              return (
                <tr
                  key={record.id}
                >
                  <td
                    style={tdStyle}
                  >
                    {record.date}
                  </td>

                  <td
                    style={tdStyle}
                  >
                    {record.systolic}
                    /
                    {record.diastolic}
                  </td>

                  <td
                    style={tdStyle}
                  >
                    {record.pulse}
                  </td>

                  <td
                    style={tdStyle}
                  >
                    {hasHeight
                      ? `${record.height} cm`
                      : "-"}
                  </td>

                  <td
                    style={tdStyle}
                  >
                    {hasWeight
                      ? `${record.weight} kg`
                      : "-"}
                  </td>

                  <td
                    style={tdStyle}
                  >
                    {bmi}
                  </td>

                  <td
                    style={tdStyle}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "center",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() =>
                          onEdit(record)
                        }
                        style={{
                          background:
                            "#2563EB",
                          color: "#fff",
                          border: "none",
                          borderRadius:
                            radius.sm,
                          padding:
                            "6px 12px",
                          cursor:
                            "pointer",
                          fontSize: 13,
                        }}
                      >
                        編輯
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "確定要刪除此筆健康紀錄嗎？"
                            )
                          ) {
                            onDelete(
                              record.id
                            );
                          }
                        }}
                        style={{
                          background:
                            "#DC2626",
                          color: "#fff",
                          border: "none",
                          borderRadius:
                            radius.sm,
                          padding:
                            "6px 12px",
                          cursor:
                            "pointer",
                          fontSize: 13,
                        }}
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "center",
  borderBottom:
    "1px solid #E5E7EB",
  color: colors.primary,
  fontWeight: 600,
  fontSize: 14,
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "center",
  borderBottom:
    "1px solid #F3F4F6",
  fontSize: 14,
};
