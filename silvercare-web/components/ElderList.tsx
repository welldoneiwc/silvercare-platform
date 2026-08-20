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
import { supabase } from "../utils/supabase";

export type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
  elder_type: string;
  living_status: string;
  contact_method: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
};

type Props = {
  onSelectElder: (elder: Elder) => void;
};

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
   * 第一次載入 Supabase 長者資料
   */
  useEffect(() => {
    const loadElders = async () => {
      try {
        const {
          data,
          error,
        } = await supabase
          .from("elders")
          .select(
            `
              id,
              name,
              gender,
              birthday,
              phone,
              elder_type,
              living_status,
              contact_method,
              emergency_contact_name,
              emergency_contact_relation,
              emergency_contact_phone
            `
          )
          .order("id", {
            ascending: true,
          });

        if (error) {
          console.error(
            "讀取長者資料失敗：",
            error
          );

          setElders([]);
          setLoaded(true);
          return;
        }

        const safeData: Elder[] =
          (data ?? []).map(
            (item) => ({
              id: Number(item.id),
              name: item.name ?? "",
              gender: item.gender ?? "",
              birthday:
                item.birthday ?? "",
              phone: item.phone ?? "",
              elder_type:
                item.elder_type ??
                "出席型",
              living_status:
                item.living_status ??
                "一般",
              contact_method:
                item.contact_method ??
                "電話",
              emergency_contact_name:
                item.emergency_contact_name ??
                "",
              emergency_contact_relation:
                item.emergency_contact_relation ??
                "",
              emergency_contact_phone:
                item.emergency_contact_phone ??
                "",
            })
          );

        setElders(safeData);
        setLoaded(true);
      } catch (error) {
        console.error(
          "讀取長者資料發生錯誤：",
          error
        );

        setElders([]);
        setLoaded(true);
      }
    };

    loadElders();
  }, []);

  /**
   * 新增長者到 Supabase
   */
  const handleAddElder = async (
    elder: Omit<Elder, "id">
  ) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("elders")
        .insert({
          name: elder.name,
          gender: elder.gender,
          birthday: elder.birthday,
          phone: elder.phone,
          elder_type:
            elder.elder_type,
          living_status:
            elder.living_status,
          contact_method:
            elder.contact_method,
          emergency_contact_name:
            elder.emergency_contact_name,
          emergency_contact_relation:
            elder.emergency_contact_relation,
          emergency_contact_phone:
            elder.emergency_contact_phone,
        })
        .select(
          `
            id,
            name,
            gender,
            birthday,
            phone,
            elder_type,
            living_status,
            contact_method,
            emergency_contact_name,
            emergency_contact_relation,
            emergency_contact_phone
          `
        )
        .single();

      if (error) {
        console.error(
          "新增長者失敗：",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );

        window.alert(
          `新增長者失敗：${error.message}`
        );

        return;
      }

      if (!data) {
        window.alert(
          "新增長者失敗：沒有取得新增資料。"
        );

        return;
      }

      const newElder: Elder = {
        id: Number(data.id),
        name: data.name ?? "",
        gender: data.gender ?? "",
        birthday:
          data.birthday ?? "",
        phone: data.phone ?? "",
        elder_type:
          data.elder_type ??
          "出席型",
        living_status:
          data.living_status ??
          "一般",
        contact_method:
          data.contact_method ??
          "電話",
        emergency_contact_name:
          data.emergency_contact_name ??
          "",
        emergency_contact_relation:
          data.emergency_contact_relation ??
          "",
        emergency_contact_phone:
          data.emergency_contact_phone ??
          "",
      };

      setElders((prev) => [
        ...prev,
        newElder,
      ]);

      notifyStorageChanged();
    } catch (error) {
      console.error(
        "新增長者發生錯誤：",
        error
      );

      window.alert(
        "新增長者失敗，請稍後再試。"
      );
    }
  };

  /**
   * 更新長者到 Supabase
   */
  const handleUpdateElder = async (
    elder: Elder
  ) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("elders")
        .update({
          name: elder.name,
          gender: elder.gender,
          birthday: elder.birthday,
          phone: elder.phone,
          elder_type:
            elder.elder_type,
          living_status:
            elder.living_status,
          contact_method:
            elder.contact_method,
          emergency_contact_name:
            elder.emergency_contact_name,
          emergency_contact_relation:
            elder.emergency_contact_relation,
          emergency_contact_phone:
            elder.emergency_contact_phone,
        })
        .eq("id", elder.id)
        .select(
          `
            id,
            name,
            gender,
            birthday,
            phone,
            elder_type,
            living_status,
            contact_method,
            emergency_contact_name,
            emergency_contact_relation,
            emergency_contact_phone
          `
        )
        .single();

      if (error) {
        console.error(
          "更新長者失敗：",
          error
        );

        window.alert(
          `更新長者失敗：${error.message}`
        );

        return;
      }

      if (!data) {
        window.alert(
          "更新長者失敗：沒有取得更新資料。"
        );

        return;
      }

      const updatedElder: Elder = {
        id: Number(data.id),
        name: data.name ?? "",
        gender: data.gender ?? "",
        birthday:
          data.birthday ?? "",
        phone: data.phone ?? "",
        elder_type:
          data.elder_type ??
          "出席型",
        living_status:
          data.living_status ??
          "一般",
        contact_method:
          data.contact_method ??
          "電話",
        emergency_contact_name:
          data.emergency_contact_name ??
          "",
        emergency_contact_relation:
          data.emergency_contact_relation ??
          "",
        emergency_contact_phone:
          data.emergency_contact_phone ??
          "",
      };

      setElders((prev) =>
        prev.map((item) =>
          item.id === elder.id
            ? updatedElder
            : item
        )
      );

      notifyStorageChanged();
    } catch (error) {
      console.error(
        "更新長者發生錯誤：",
        error
      );

      window.alert(
        "更新長者失敗，請稍後再試。"
      );
    }
  };

  /**
   * 從 Supabase 刪除長者
   */
  const handleDeleteElder = async (
    id: number
  ) => {
    const confirmDelete =
      window.confirm(
        "確定要刪除此長者嗎？"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const { error } =
        await supabase
          .from("elders")
          .delete()
          .eq("id", id);

      if (error) {
        console.error(
          "刪除長者失敗：",
          error
        );

        window.alert(
          `刪除長者失敗：${error.message}`
        );

        return;
      }

      setElders((prev) =>
        prev.filter(
          (item) =>
            item.id !== id
        )
      );

      localStorage.removeItem(
        `health-records-${id}`
      );

      notifyStorageChanged();
    } catch (error) {
      console.error(
        "刪除長者發生錯誤：",
        error
      );

      window.alert(
        "刪除長者失敗，請稍後再試。"
      );
    }
  };

  const filteredElders =
    useMemo(() => {
      return elders.filter(
        (elder) => {
          return (
            elder.name.includes(
              keyword
            ) ||
            elder.phone.includes(
              keyword
            ) ||
            elder.gender.includes(
              keyword
            ) ||
            elder.elder_type.includes(
              keyword
            ) ||
            elder.living_status.includes(
              keyword
            ) ||
            elder.contact_method.includes(
              keyword
            ) ||
            elder.emergency_contact_name.includes(
              keyword
            )
          );
        }
      );
    }, [elders, keyword]);

  return (
    <div
      style={{
        background:
          colors.card,
        padding: "30px",
        borderRadius:
          radius.lg,
        boxShadow:
          shadow.md,
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
          <h2
            style={{
              margin: 0,
            }}
          >
            長者管理
          </h2>

          <div
            style={{
              color: "#666",
              fontSize: "14px",
              marginTop: "6px",
            }}
          >
            共{" "}
            {filteredElders.length}{" "}
            位長者
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
              borderRadius:
                "8px",
              border:
                "1px solid #ddd",
            }}
          />

          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditingElder(
                null
              );
              setOpen(true);
            }}
            style={{
              background:
                colors.primary,
              color: "#fff",
              border: "none",
              padding:
                "10px 18px",
              borderRadius:
                "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            ＋ 新增長者
          </button>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          overflowX: "auto",
        }}
      >
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
                  textAlign:
                    "center",
                  padding: "12px",
                }}
              >
                性別
              </th>

              <th
                style={{
                  textAlign:
                    "center",
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
                  textAlign:
                    "center",
                  padding: "12px",
                }}
              >
                操作
              </th>
            </tr>
          </thead>

          <tbody>
            {!loaded ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign:
                      "center",
                    padding: "32px",
                    color:
                      colors.textLight,
                  }}
                >
                  正在載入長者資料...
                </td>
              </tr>
            ) : filteredElders.length ===
              0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign:
                      "center",
                    padding: "32px",
                    color:
                      colors.textLight,
                  }}
                >
                  尚無長者資料，請新增第一位長者。
                </td>
              </tr>
            ) : (
              filteredElders.map(
                (elder) => (
                  <tr
                    key={elder.id}
                  >
                    <td
                      style={{
                        padding:
                          "12px",
                      }}
                    >
                      {elder.name}
                    </td>

                    <td
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "12px",
                      }}
                    >
                      {elder.gender}
                    </td>

                    <td
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "12px",
                      }}
                    >
                      {calculateAge(
                        elder.birthday
                      )}{" "}
                      歲
                    </td>

                    <td
                      style={{
                        padding:
                          "12px",
                      }}
                    >
                      {elder.phone}
                    </td>

                    <td
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "12px",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onSelectElder(
                            elder
                          )
                        }
                        style={{
                          marginRight:
                            "8px",
                          padding:
                            "6px 12px",
                          borderRadius:
                            "6px",
                          border:
                            "none",
                          background:
                            "#198754",
                          color:
                            "#fff",
                          cursor:
                            "pointer",
                        }}
                      >
                        查看
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingElder(
                            elder
                          );
                          setIsEditing(
                            true
                          );
                          setOpen(
                            true
                          );
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
                        type="button"
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
                          border:
                            "none",
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
                )
              )
            )}
          </tbody>
        </table>
      </div>

      <AddElderModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingElder(
            null
          );
          setIsEditing(false);
        }}
        onSave={handleAddElder}
        onUpdate={handleUpdateElder}
        isEditing={isEditing}
        editingElder={
          editingElder
        }
      />
    </div>
  );
}