"use client";

import HealthRecordTable from "./HealthRecordTable";

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
  onAdd: () => void;
};

export default function HealthSection({
  records,
  onAdd,
}: Props) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#163A43",
          }}
        >
          健康量測
        </h3>

        <button
          onClick={onAdd}
          style={{
            background: "#163A43",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          ＋ 新增量測
        </button>
      </div>

      <HealthRecordTable records={records} />
    </div>
  );
}