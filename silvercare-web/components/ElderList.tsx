"use client";

import { useEffect, useMemo, useState } from "react";

import AddElderModal from "./AddElderModal";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

export type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};

type Props = {
  onSelectElder: (elder: Elder) => void;
};

const STORAGE_KEY = "silvercare-elders";

const DEFAULT_ELDERS: Elder[] = [
  {
    id: 1,
    name: "王大明",
    gender: "男",
    birthday: "1947-05-12",
    phone: "0912-345-678",
  },
  {
    id: 2,
    name: "李阿姨",
    gender: "女",
    birthday: "1943-10-28",
    phone: "0923-456-789",
  },
  {
    id: 3,
    name: "林伯伯",
    gender: "男",
    birthday: "1950-01-16",
    phone: "0934-567-890",
  },
];
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

export default function ElderList({
  onSelectElder,
}: Props) {
  const [elders, setElders] =
    useState<Elder[]>(DEFAULT_ELDERS);

  const [keyword, setKeyword] = useState("");

  const [open, setOpen] = useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [editingElder, setEditingElder] =
    useState<Elder | null>(null);

  useEffect(() => {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
      setElders(JSON.parse(saved));
    } catch (error) {
      console.error("讀取長者資料失敗：", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(elders)
    );
  }, [elders]);

  const handleAddElder = (elder: {
    name: string;
    gender: string;
    birthday: string;
    phone: string;
  }) => {
    setElders((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...elder,
      },
    ]);
  };

  const handleUpdateElder = (elder: Elder) => {
    setElders((prev) =>
      prev.map((item) =>
        item.id === elder.id ? elder : item
      )
    );
  };

  const handleDeleteElder = (id: number) => {
    const confirmDelete = window.confirm(
      "確定要刪除此長者嗎？"
    );

    if (!confirmDelete) return;

    setElders((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const filteredElders = useMemo(() => {
    return elders.filter((elder) => {
      return (
        elder.name.includes(keyword) ||
        elder.phone.includes(keyword) ||
        elder.gender.includes(keyword)
      );
    });
  }, [elders, keyword]);

  return (
    <div
      style={{
        background: colors.card,
        padding: "30px",
        borderRadius: radius.large,
        boxShadow: shadow.card,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            👵 長者管理
          </h2>

          <div
            style={{
              color: "#666",
              fontSize: "14px",
              marginTop: "6px",
            }}
          >
            共 {filteredElders.length} 位長者
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <input
            placeholder="搜尋姓名 / 電話"
            value={keyword}
            onChange={(e) =>
              setKeyword(e.target.value)
            }
            style={{
              width: "220px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />

          <button
            onClick={() => {
              setEditingElder(null);
              setIsEditing(false);
              setOpen(true);
            }}
            style={{
              background: "#163A43",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            ＋ 新增長者
          </button>
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "12px" }}>
              姓名
            </th>

            <th style={{ textAlign: "center", padding: "12px" }}>
              性別
            </th>

            <th style={{ textAlign: "center", padding: "12px" }}>
              年齡
            </th>

            <th style={{ textAlign: "left", padding: "12px" }}>
              電話
            </th>

            <th style={{ textAlign: "center", padding: "12px" }}>
              操作
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredElders.map((elder) => (
            <tr key={elder.id}>
              <td style={{ padding: "12px" }}>
                {elder.name}
              </td>

              <td
                style={{
                  textAlign: "center",
                  padding: "12px",
                }}
              >
                {elder.gender}
              </td>

              <td
                style={{
                  textAlign: "center",
                  padding: "12px",
                }}
              >
               {calculateAge(elder.birthday)} 歲
              </td>

              <td style={{ padding: "12px" }}>
                {elder.phone}
              </td>

              <td
                style={{
                  textAlign: "center",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                <button
                  onClick={() =>
                    onSelectElder(elder)
                  }
                  style={{
                    marginRight: "8px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#198754",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  查看
                </button>

                <button
                  onClick={() => {
                    setEditingElder(elder);
                    setIsEditing(true);
                    setOpen(true);
                  }}
                  style={{
                    marginRight: "8px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                    background: "#fff",
                  }}
                >
                  編輯
                </button>

                <button
                  onClick={() =>
                    handleDeleteElder(elder.id)
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#dc3545",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  刪除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AddElderModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingElder(null);
          setIsEditing(false);
        }}
        onSave={handleAddElder}
        onUpdate={handleUpdateElder}
        isEditing={isEditing}
        editingElder={editingElder}
      />
    </div>
  );
}