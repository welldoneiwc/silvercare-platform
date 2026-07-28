"use client";

import AddHealthRecordModal from "./AddHealthRecordModal";

import { useState } from "react";

type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};
function calculateAge(birthday: string): number {
  const birth = new Date(birthday);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const month = today.getMonth() - birth.getMonth();

  if (
    month < 0 ||
    (month === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}
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
  elder: Elder;
  onBack: () => void;
};

export default function ElderProfile({
  elder,
  onBack,
}: Props) {
  const [openHealthModal, setOpenHealthModal] =
  useState(false);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              color: "#163A43",
            }}
          >
            長者詳細資料
          </h2>

          <p
            style={{
              marginTop: "8px",
              color: "#666",
              fontSize: "15px",
            }}
          >
            檢視長者基本資訊
          </p>
        </div>

        <button
          onClick={onBack}
          style={{
            background: "#163A43",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          返回列表
        </button>
      </div>

      <div
    
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          rowGap: "18px",
          columnGap: "20px",
        }}
      >
        <div style={{ fontWeight: 600, color: "#555" }}>
          姓名
        </div>
        <div>{elder.name}</div>

        <div style={{ fontWeight: 600, color: "#555" }}>
          性別
        </div>
        <div>{elder.gender}</div>

        <div style={{ fontWeight: 600, color: "#555" }}>
  生日
</div>
<div>{elder.birthday}</div>

<div style={{ fontWeight: 600, color: "#555" }}>
  年齡
</div>
<div>{calculateAge(elder.birthday)} 歲</div>


<div style={{ fontWeight: 600, color: "#555" }}>
  電話
</div>
<div>{elder.phone}</div>
      </div>

      <hr
        style={{
          margin: "40px 0",
          border: "none",
          borderTop: "1px solid #e5e7eb",
        }}
      />

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
          
  onClick={() => setOpenHealthModal(true)}
  
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

        {records.length === 0 ? (
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
) : (
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
    }}
  >
    <thead>
      <tr>
        <th>日期</th>
        <th>血壓</th>
        <th>脈搏</th>
        <th>身高</th>
        <th>體重</th>
      </tr>
    </thead>

    <tbody>
      {records.map((item) => (
        <tr key={item.id}>
          <td>{item.date}</td>
          <td>
            {item.systolic}/{item.diastolic}
          </td>
          <td>{item.pulse}</td>
          <td>{item.height} cm</td>
          <td>{item.weight} kg</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
      </div>

      <hr
        style={{
          margin: "40px 0",
          border: "none",
          borderTop: "1px solid #e5e7eb",
        }}
      />

      <div>
        <h3
          style={{
            color: "#163A43",
            marginBottom: "12px",
          }}
        >
          課程參與紀錄
        </h3>

        <div
          style={{
            color: "#888",
            fontSize: "15px",
          }}
        >
          尚未建立課程紀錄。
        </div>
      </div>

      <hr
        style={{
          margin: "40px 0",
          border: "none",
          borderTop: "1px solid #e5e7eb",
        }}
      />

            <div>
        <h3
          style={{
            color: "#163A43",
            marginBottom: "12px",
          }}
        >
          照護備註
        </h3>

        <div
          style={{
            color: "#888",
            fontSize: "15px",
          }}
        >
          尚未建立照護備註。
        </div>
      </div>

      <AddHealthRecordModal
  open={openHealthModal}
  onClose={() => setOpenHealthModal(false)}
  onSave={(record) => {
    setRecords((prev) => [
      {
        id: Date.now(),
        ...record,
      },
      ...prev,
    ]);

    setOpenHealthModal(false);
  }}
/>
    </div>
  );
}