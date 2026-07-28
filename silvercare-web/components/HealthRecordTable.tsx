"use client";

type HealthRecord = {
  id: number;
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  height: number;
  weight: number;
};

type Props = {
  records: HealthRecord[];
};

export default function HealthRecordTable({
  records,
}: Props) {
  if (records.length === 0) {
    return (
      <div
        style={{
          border: "1px dashed #d1d5db",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
          color: "#888",
          background: "#fafafa",
        }}
      >
        目前尚無健康量測資料
      </div>
    );
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr
          style={{
            background: "#f8fafc",
          }}
        >
          <th style={thStyle}>日期</th>
          <th style={thStyle}>血壓</th>
          <th style={thStyle}>脈搏</th>
          <th style={thStyle}>身高</th>
          <th style={thStyle}>體重</th>
        </tr>
      </thead>

      <tbody>
        {records.map((item) => (
          <tr key={item.id}>
            <td style={tdStyle}>{item.date}</td>

            <td style={tdStyle}>
              {item.systolic}/{item.diastolic}
            </td>

            <td style={tdStyle}>
              {item.pulse}
            </td>

            <td style={tdStyle}>
              {item.height} cm
            </td>

            <td style={tdStyle}>
              {item.weight} kg
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle = {
  borderBottom: "1px solid #e5e7eb",
  padding: "12px",
  textAlign: "left" as const,
  color: "#163A43",
  fontWeight: 600,
};

const tdStyle = {
  borderBottom: "1px solid #f1f5f9",
  padding: "12px",
};