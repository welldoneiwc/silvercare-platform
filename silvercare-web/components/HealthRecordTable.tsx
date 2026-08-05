"use client";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";

export type HealthRecord = {
  id: number;
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  height: number;
  weight: number;
  createdAt?: string;
};

type Props = {
  records: HealthRecord[];
  onEdit: (record: HealthRecord) => void;
  onDelete: (id: number) => void;
};

function calculateBMI(
  height: number,
  weight: number
) {
  if (!height || !weight) return "-";

  const bmi =
    weight / Math.pow(height / 100, 2);

  return bmi.toFixed(1);
}

export default function HealthRecordTable({
  records,
  onEdit,
  onDelete,
}: Props) {
  if (records.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          color: colors.textLight,
          textAlign: "center",
        }}
      >
        尚無健康量測紀錄
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: "auto",
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
              background: "#f6f8fa",
            }}
          >
            <th style={thStyle}>日期</th>
            <th style={thStyle}>血壓</th>
            <th style={thStyle}>脈搏</th>
            <th style={thStyle}>身高</th>
            <th style={thStyle}>體重</th>
            <th style={thStyle}>BMI</th>
            <th style={thStyle}>操作</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
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
                {record.height} cm
              </td>

              <td style={tdStyle}>
                {record.weight} kg
              </td>

              <td style={tdStyle}>
                {calculateBMI(
                  record.height,
                  record.weight
                )}
              </td>

              <td style={tdStyle}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={() =>
                      onEdit(record)
                    }
                    style={{
                      background:
                        colors.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius:
                        radius.md,
                      padding:
                        "6px 12px",
                      cursor: "pointer",
                    }}
                  >
                    編輯
                  </button>

                  <button
                    onClick={() =>
                      onDelete(record.id)
                    }
                    style={{
                      background:
                        "#dc3545",
                      color: "#fff",
                      border: "none",
                      borderRadius:
                        radius.md,
                      padding:
                        "6px 12px",
                      cursor: "pointer",
                    }}
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #ddd",
  textAlign: "center",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #eee",
  textAlign: "center",
};