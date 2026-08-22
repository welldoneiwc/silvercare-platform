"use client";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";

import { AttendanceRecord } from "./AttendanceSection";

type Props = {
  records: AttendanceRecord[];
  onDelete: (id: string) => void;
};

export default function AttendanceTable({
  records,
  onDelete,
}: Props) {
  return (
    <>
      <style>{`
        .silvercare-attendance-records-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .silvercare-attendance-records-table {
          width: 100%;
          min-width: 560px;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .silvercare-attendance-records-table
        th,
        .silvercare-attendance-records-table
        td {
          white-space: nowrap;
        }

        .silvercare-attendance-record-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 52px;
          white-space: nowrap;
          word-break: keep-all;
          overflow-wrap: normal;
        }

        .silvercare-attendance-record-delete {
          white-space: nowrap;
          word-break: keep-all;
          overflow-wrap: normal;
        }

        @media (max-width: 767px) {
          .silvercare-attendance-records-table {
            min-width: 540px;
          }

          .silvercare-attendance-records-table th,
          .silvercare-attendance-records-table td {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
        }
      `}</style>

      <div
        style={{
          background: "#fff",
          borderRadius: radius.lg,
          overflow: "hidden",
        }}
      >
        <div className="silvercare-attendance-records-wrap">
          <table className="silvercare-attendance-records-table">
            <thead>
              <tr
                style={{
                  background: "#F7FAFC",
                }}
              >
                <th
                  style={{
                    ...thStyle,
                    width: "20%",
                  }}
                >
                  姓名
                </th>

                <th
                  style={{
                    ...thStyle,
                    width: "18%",
                  }}
                >
                  日期
                </th>

                <th
                  style={{
                    ...thStyle,
                    width: "22%",
                  }}
                >
                  簽到時間
                </th>

                <th
                  style={{
                    ...thStyle,
                    width: "18%",
                  }}
                >
                  狀態
                </th>

                <th
                  style={{
                    ...thStyle,
                    width: "22%",
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 32,
                      textAlign:
                        "center",
                      color:
                        colors.textLight,
                      whiteSpace:
                        "normal",
                    }}
                  >
                    今日尚無簽到紀錄
                  </td>
                </tr>
              ) : (
                records.map(
                  (record) => (
                    <tr
                      key={record.id}
                    >
                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          record.elderName
                        }
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          record.date
                        }
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          record.checkInTime
                        }
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        <span
                          className="silvercare-attendance-record-status"
                          style={{
                            padding:
                              "4px 10px",
                            borderRadius:
                              radius.sm,
                            background:
                              record.status ===
                              "出席"
                                ? "#DCFCE7"
                                : record.status ===
                                  "請假"
                                ? "#FEF3C7"
                                : "#FEE2E2",
                            color:
                              record.status ===
                              "出席"
                                ? "#166534"
                                : record.status ===
                                  "請假"
                                ? "#92400E"
                                : "#991B1B",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        <button
                          type="button"
                          className="silvercare-attendance-record-delete"
                          onClick={() => {
                            const confirmed =
                              window.confirm(
                                "確定要刪除此筆簽到紀錄嗎？"
                              );

                            if (
                              confirmed
                            ) {
                              onDelete(
                                record.id
                              );
                            }
                          }}
                          style={{
                            background:
                              "#DC2626",
                            color:
                              "#fff",
                            border:
                              "none",
                            borderRadius:
                              radius.sm,
                            padding:
                              "6px 12px",
                            cursor:
                              "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const thStyle:
  React.CSSProperties = {
  padding: "12px",
  textAlign: "center",
  borderBottom:
    "1px solid #E5E7EB",
  color: colors.primary,
  fontWeight: 600,
  fontSize: 14,
  whiteSpace: "nowrap",
};

const tdStyle:
  React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "center",
  borderBottom:
    "1px solid #F3F4F6",
  fontSize: 14,
  whiteSpace: "nowrap",
};