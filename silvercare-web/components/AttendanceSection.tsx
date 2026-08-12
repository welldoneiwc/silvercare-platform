"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

import { notifyStorageChanged } from "../utils/storageEvents";

import AttendanceTable from "./AttendanceTable";

import { Elder } from "./ElderList";

export type AttendanceRecord = {
  id: string;
  elderId: number;
  elderName: string;
  date: string;
  checkInTime: string;
  status: "出席" | "請假" | "缺席";
};

type Props = {
  elders: Elder[];
  onCheckInSuccess?: (elder: Elder) => void;
};

type NewElderForm = {
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};

const ELDER_STORAGE_KEY =
  "silvercare-elders";

const createEmptyElderForm = (): NewElderForm => ({
  name: "",
  gender: "",
  birthday: "",
  phone: "",
});

export default function AttendanceSection({
  elders,
  onCheckInSuccess,
}: Props) {
  const [records, setRecords] =
    useState<AttendanceRecord[]>([]);

  const [keyword, setKeyword] =
    useState("");

  const [showAddElder, setShowAddElder] =
    useState(false);

  const [newElderForm, setNewElderForm] =
    useState<NewElderForm>(
      createEmptyElderForm()
    );

  const [localElders, setLocalElders] =
    useState<Elder[]>(elders);

  const storageKey =
    "attendance-records";

  useEffect(() => {
    setLocalElders(elders);
  }, [elders]);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          storageKey
        );

      if (!saved) {
        setRecords([]);
        return;
      }

      const parsed =
        JSON.parse(saved) as AttendanceRecord[];

      setRecords(
        Array.isArray(parsed)
          ? parsed
          : []
      );
    } catch (error) {
      console.error(
        "讀取簽到資料失敗：",
        error
      );

      setRecords([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify(records)
    );
  }, [records]);

  const today = useMemo(() => {
    return new Date()
      .toISOString()
      .split("T")[0];
  }, []);

  const todayRecords =
    useMemo(() => {
      return records.filter(
        (record) =>
          record.date === today
      );
    }, [records, today]);

  const handleCheckIn = (
    elder: Elder
  ) => {
    const exists =
      todayRecords.some(
        (record) =>
          record.elderId === elder.id
      );

    if (exists) {
      return;
    }

    const now = new Date();

    const newRecord: AttendanceRecord =
      {
        id: crypto.randomUUID(),
        elderId: elder.id,
        elderName: elder.name,
        date: today,
        checkInTime:
          now.toLocaleTimeString(
            "zh-TW",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
        status: "出席",
      };

    setRecords((prev) => [
      newRecord,
      ...prev,
    ]);

    notifyStorageChanged();

    setKeyword("");

    onCheckInSuccess?.(elder);
  };

  const handleAddElder = () => {
    const name =
      newElderForm.name.trim();

    if (!name) {
      alert("請輸入長者姓名。");
      return;
    }

    const duplicated =
      localElders.some(
        (elder) =>
          elder.name.trim() ===
          name
      );

    if (duplicated) {
      alert(
        "長者名單中已有相同姓名，請先確認是否已存在。"
      );
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          ELDER_STORAGE_KEY
        );

      const existingElders =
        saved
          ? (JSON.parse(saved) as Elder[])
          : [];

      const safeExistingElders =
        Array.isArray(
          existingElders
        )
          ? existingElders
          : [];

      const numericIds =
        safeExistingElders
          .map(
            (elder) =>
              Number(elder.id)
          )
          .filter(
            (id) =>
              Number.isFinite(id)
          );

      const nextId =
        numericIds.length > 0
          ? Math.max(
              ...numericIds
            ) + 1
          : 1;

      const newElder: Elder = {
        id: nextId,
        name,
        gender:
          newElderForm.gender.trim(),
        birthday:
          newElderForm.birthday,
        phone:
          newElderForm.phone.trim(),
      };

      const updatedElders = [
        ...safeExistingElders,
        newElder,
      ];

      localStorage.setItem(
        ELDER_STORAGE_KEY,
        JSON.stringify(
          updatedElders
        )
      );

      setLocalElders(
        updatedElders
      );

      setNewElderForm(
        createEmptyElderForm()
      );

      setShowAddElder(false);

      notifyStorageChanged();

      handleCheckIn(newElder);
    } catch (error) {
      console.error(
        "新增長者失敗：",
        error
      );

      alert(
        "新增長者失敗，請稍後再試。"
      );
    }
  };

  const handleDelete = (
    id: string
  ) => {
    setRecords((prev) =>
      prev.filter(
        (record) =>
          record.id !== id
      )
    );

    notifyStorageChanged();
  };

  const filteredElders =
    useMemo(() => {
      const search =
        keyword.trim();

      if (!search) {
        return [];
      }

      return localElders.filter(
        (elder) => {
          const name =
            elder.name ?? "";

          const phone =
            elder.phone ?? "";

          return (
            name.includes(
              search
            ) ||
            phone.includes(
              search
            )
          );
        }
      );
    }, [localElders, keyword]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: radius.lg,
        boxShadow: shadow.md,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* ==================== */}
      {/* Header */}
      {/* ==================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: colors.primary,
            }}
          >
            今日簽到
          </h2>

          <div
            style={{
              marginTop: 8,
              color:
                colors.textLight,
              fontSize: 14,
            }}
          >
            今日已簽到：
            {todayRecords.length} 人
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddElder(
              (current) =>
                !current
            );

            setNewElderForm(
              createEmptyElderForm()
            );
          }}
          style={{
            border: "none",
            borderRadius:
              radius.md,
            padding:
              "10px 16px",
            background:
              colors.primary,
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ＋ 新增長者
        </button>
      </div>

      {/* ==================== */}
      {/* Add Elder */}
      {/* ==================== */}

      {showAddElder && (
        <div
          style={{
            padding: 20,
            borderRadius:
              radius.md,
            background:
              "#F8FAFC",
            border:
              "1px solid #E5E7EB",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color:
                colors.primary,
            }}
          >
            ➕ 新增長者並立即簽到
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, 1fr)",
              gap: 16,
            }}
          >
            <div>
              <label
                style={labelStyle}
              >
                姓名
              </label>

              <input
                type="text"
                value={
                  newElderForm.name
                }
                onChange={(event) =>
                  setNewElderForm(
                    (current) => ({
                      ...current,
                      name:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="請輸入姓名"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={labelStyle}
              >
                性別
              </label>

              <select
                value={
                  newElderForm.gender
                }
                onChange={(event) =>
                  setNewElderForm(
                    (current) => ({
                      ...current,
                      gender:
                        event.target
                          .value,
                    })
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  請選擇性別
                </option>

                <option value="男">
                  男
                </option>

                <option value="女">
                  女
                </option>
              </select>
            </div>

            <div>
              <label
                style={labelStyle}
              >
                生日
              </label>

              <input
                type="date"
                value={
                  newElderForm.birthday
                }
                onChange={(event) =>
                  setNewElderForm(
                    (current) => ({
                      ...current,
                      birthday:
                        event.target
                          .value,
                    })
                  )
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={labelStyle}
              >
                電話
              </label>

              <input
                type="text"
                value={
                  newElderForm.phone
                }
                onChange={(event) =>
                  setNewElderForm(
                    (current) => ({
                      ...current,
                      phone:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="請輸入電話"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={
                handleAddElder
              }
              style={
                primaryButtonStyle
              }
            >
              新增並立即簽到
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAddElder(
                  false
                );

                setNewElderForm(
                  createEmptyElderForm()
                );
              }}
              style={
                secondaryButtonStyle
              }
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* ==================== */}
      {/* Search */}
      {/* ==================== */}

      <div>
        <div
          style={{
            marginBottom: 8,
            color: colors.primary,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          搜尋長者
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(e) =>
            setKeyword(
              e.target.value
            )
          }
          placeholder="輸入姓名或電話搜尋..."
          style={{
            width: "100%",
            boxSizing:
              "border-box",
            padding:
              "13px 16px",
            border:
              "1px solid #D1D5DB",
            borderRadius:
              radius.md,
            fontSize: 16,
            outline: "none",
          }}
        />
      </div>

      {/* ==================== */}
      {/* Search Results */}
      {/* ==================== */}

      {keyword.trim() && (
        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            gap: 10,
          }}
        >
          <div
            style={{
              color:
                colors.textLight,
              fontSize: 13,
            }}
          >
            搜尋結果：
            {filteredElders.length} 人
          </div>

          {filteredElders.length ===
          0 ? (
            <div
              style={{
                padding: 20,
                textAlign:
                  "center",
                background:
                  "#F7FAFC",
                borderRadius:
                  radius.md,
                color:
                  colors.textLight,
              }}
            >
              <div>
                找不到符合的長者
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddElder(
                    true
                  );

                  setNewElderForm(
                    (
                      current
                    ) => ({
                      ...current,
                      name:
                        keyword.trim(),
                    })
                  );
                }}
                style={{
                  marginTop: 12,
                  border: "none",
                  background:
                    colors.primary,
                  color: "#fff",
                  borderRadius:
                    radius.md,
                  padding:
                    "9px 16px",
                  cursor:
                    "pointer",
                  fontWeight: 700,
                }}
              >
                ＋ 新增這位長者
              </button>
            </div>
          ) : (
            filteredElders.map(
              (elder) => {
                const checked =
                  todayRecords.some(
                    (record) =>
                      record.elderId ===
                      elder.id
                  );

                return (
                  <div
                    key={
                      elder.id
                    }
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: 16,
                      padding:
                        "14px 16px",
                      border:
                        "1px solid #E5E7EB",
                      borderRadius:
                        radius.md,
                      background:
                        checked
                          ? "#F0FDF4"
                          : "#fff",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color:
                            colors.primary,
                        }}
                      >
                        {
                          elder.name
                        }
                      </div>

                      {elder.phone && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 13,
                            color:
                              colors.textLight,
                          }}
                        >
                          {
                            elder.phone
                          }
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={
                        checked
                      }
                      onClick={() =>
                        handleCheckIn(
                          elder
                        )
                      }
                      style={{
                        border: "none",
                        borderRadius:
                          radius.md,
                        padding:
                          "9px 18px",
                        background:
                          checked
                            ? "#D1FAE5"
                            : colors.primary,
                        color:
                          checked
                            ? "#065F46"
                            : "#fff",
                        cursor:
                          checked
                            ? "default"
                            : "pointer",
                        fontWeight: 600,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {checked
                        ? "✓ 已簽到"
                        : "簽到"}
                    </button>
                  </div>
                );
              }
            )
          )}
        </div>
      )}

      {/* ==================== */}
      {/* Empty Search State */}
      {/* ==================== */}

      {!keyword.trim() &&
        !showAddElder && (
          <div
            style={{
              padding: 28,
              textAlign:
                "center",
              background:
                "#F7FAFC",
              borderRadius:
                radius.md,
              color:
                colors.textLight,
            }}
          >
            請輸入姓名或電話開始搜尋
          </div>
        )}

      {/* ==================== */}
      {/* Attendance Table */}
      {/* ==================== */}

      <AttendanceTable
        records={todayRecords}
        onDelete={
          handleDelete
        }
      />
    </div>
  );
}

const labelStyle:
  React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border:
    "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 15,
  background: "#fff",
};

const primaryButtonStyle:
  React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  padding: "11px 18px",
  background:
    colors.primary,
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle:
  React.CSSProperties = {
  border:
    "1px solid #D1D5DB",
  borderRadius: 8,
  padding: "11px 18px",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontWeight: 600,
};