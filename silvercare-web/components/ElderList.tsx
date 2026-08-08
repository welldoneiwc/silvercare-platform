"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AddElderModal from "./AddElderModal";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";
import { notifyStorageChanged } from "../utils/storageEvents";

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

function calculateAge(
  birthday: string
): number {
  const birth = new Date(birthday);
  const today = new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const month =
    today.getMonth() -
    birth.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() <
        birth.getDate())
  ) {
    age--;
  }

  return age;
}

export default function ElderList({
  onSelectElder,
}: Props) {
  const [elders, setElders] =
    useState<Elder[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [keyword, setKeyword] =
    useState("");

  const [open, setOpen] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [editingElder, setEditingElder] =
    useState<Elder | null>(null);

  /**
   * 第一次載入 LocalStorage
   */
  useEffect(() => {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      setElders([]);
      setLoaded(true);
      return;
    }

    try {
      const parsed =
        JSON.parse(saved) as Elder[];

      setElders(parsed);
    } catch (error) {
      console.error(
        "讀取長者資料失敗：",
        error
      );

      setElders([]);
    }

    setLoaded(true);
  }, []);

  /**
   * 寫回 LocalStorage
   */
  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(elders)
    );

    notifyStorageChanged();
  }, [elders, loaded]);

  const handleAddElder = (
    elder: Omit<Elder, "id">
  ) => {
    setElders((prev) => {
      const nextId =
        prev.length === 0
          ? 1
          : Math.max(
              ...prev.map(
                (item) => item.id
              )
            ) + 1;

      return [
        ...prev,
        {
          id: nextId,
          ...elder,
        },
      ];
    });
  };

  const handleUpdateElder = (
    elder: Elder
  ) => {
    setElders((prev) =>
      prev.map((item) =>
        item.id === elder.id
          ? elder
          : item
      )
    );
  };

  const handleDeleteElder = (
    id: number
  ) => {
    const confirmDelete =
      window.confirm(
        "確定要刪除此長者嗎？"
      );

    if (!confirmDelete) return;

    setElders((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );

    localStorage.removeItem(
      `health-records-${id}`
    );

    notifyStorageChanged();
  };

  const filteredElders =
    useMemo(() => {
      return elders.filter((elder) => {
        return (
          elder.name.includes(
            keyword
          ) ||
          elder.phone?.includes(
            keyword
          ) ||
          elder.gender?.includes(
            keyword
          )
        );
      });
    }, [elders, keyword]);

  return (
    <div
      style={{
        background: colors.card,
        padding: "30px",
        borderRadius: radius.lg,
        boxShadow: shadow.md,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
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
              setKeyword(
                e.target.value
              )
            }
            style={{
              width: "220px",
              padding: "10px",
              borderRadius: "8px",
              border:
                "1px solid #ddd",
            }}
          />

          <button
            onClick={() => {
              setIsEditing(false);
              setEditingElder(null);
              setOpen(true);
            }}
            style={{
              background:
                colors.primary,
              color: "#fff",
              border: "none",
              padding:
                "10px 18px",
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
          borderCollapse:
            "collapse",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "12px",
              }}
            >
              姓名
            </th>

            <th
              style={{
                textAlign: "center",
                padding: "12px",
              }}
            >
              性別
            </th>

            <th
              style={{
                textAlign: "center",
                padding: "12px",
              }}
            >
              年齡
            </th>

            <th
              style={{
                textAlign: "left",
                padding: "12px",
              }}
            >
              電話
            </th>

            <th
              style={{
                textAlign: "center",
                padding: "12px",
              }}
            >
              操作
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredElders.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color:
                    colors.textLight,
                }}
              >
                尚無長者資料，請新增第一位長者。
              </td>
            </tr>
          ) : (
            filteredElders.map((elder) => (
              <tr key={elder.id}>
                <td
                  style={{
                    padding: "12px",
                  }}
                >
                  {elder.name}
                </td>

                <td
                  style={{
                    textAlign:
                      "center",
                    padding: "12px",
                  }}
                >
                  {elder.gender}
                </td>

                <td
                  style={{
                    textAlign:
                      "center",
                    padding: "12px",
                  }}
                >
                  {calculateAge(
                    elder.birthday
                  )}{" "}
                  歲
                </td>

                <td
                  style={{
                    padding: "12px",
                  }}
                >
                  {elder.phone}
                </td>

                <td
                  style={{
                    textAlign:
                      "center",
                    padding: "12px",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  <button
                    onClick={() =>
                      onSelectElder(elder)
                    }
                    style={{
                      marginRight:
                        "8px",
                      padding:
                        "6px 12px",
                      borderRadius:
                        "6px",
                      border: "none",
                      background:
                        "#198754",
                      color: "#fff",
                      cursor:
                        "pointer",
                    }}
                  >
                    查看
                  </button>

                  <button
                    onClick={() => {
                      setEditingElder(
                        elder
                      );
                      setIsEditing(true);
                      setOpen(true);
                    }}
                    style={{
                      marginRight:
                        "8px",
                      padding:
                        "6px 12px",
                      borderRadius:
                        "6px",
                      border:
                        "1px solid #ccc",
                      background:
                        "#fff",
                      cursor:
                        "pointer",
                    }}
                  >
                    編輯
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteElder(
                        elder.id
                      )
                    }
                    style={{
                      padding:
                        "6px 12px",
                      borderRadius:
                        "6px",
                      border: "none",
                      background:
                        "#DC2626",
                      color:
                        "#fff",
                      cursor:
                        "pointer",
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

