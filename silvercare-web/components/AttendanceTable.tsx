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
    <div
      style={{
        background: "#fff",
        borderRadius: radius.lg,
        overflow: "hidden",
      }}
    >
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
              姓名
            </th>

            <th style={thStyle}>
              日期
            </th>

            <th style={thStyle}>
              簽到時間
            </th>

            <th style={thStyle}>
              狀態
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
                colSpan={5}
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: colors.textLight,
                }}
              >
                今日尚無簽到紀錄
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id}>
                <td style={tdStyle}>
                  {record.elderName}
                </td>

                <td style={tdStyle}>
                  {record.date}
                </td>

                <td style={tdStyle}>
                  {record.checkInTime}
                </td>

                <td style={tdStyle}>
                  <span
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

                <td style={tdStyle}>
                                  <button
                    onClick={() => {
  console.log(
    "DELETE BUTTON CLICK:",
    record.id
  );

  if (
    confirm(
      "確定要刪除此筆簽到紀錄嗎？"
    )
  ) {
    console.log(
      "DELETE CONFIRMED:",
      record.id
    );

    onDelete(
      record.id
    );
  }
}}
                    style={{
                      background: "#DC2626",
                      color: "#fff",
                      border: "none",
                      borderRadius:
                        radius.sm,
                      padding:
                        "6px 12px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
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
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "center",
  borderBottom: "1px solid #F3F4F6",
  fontSize: 14,
};