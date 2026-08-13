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
import type { Elder } from "./ElderList";

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

const ATTENDANCE_STORAGE_KEY =
  "attendance-records";

const createEmptyElderForm =
  (): NewElderForm => ({
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

  const [loaded, setLoaded] =
    useState(false);

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

  /**
   * 今天已完成健康量測的長者 ID
   */
  const [measuredElderIds, setMeasuredElderIds] =
    useState<number[]>([]);

  useEffect(() => {
    setLocalElders(elders);
  }, [elders]);

  /**
   * 載入簽到資料
   */
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          ATTENDANCE_STORAGE_KEY
        );

      if (!saved) {
        setRecords([]);
        setLoaded(true);
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
    } finally {
      setLoaded(true);
    }
  }, []);

  /**
   * 簽到資料寫回 LocalStorage
   */
  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      ATTENDANCE_STORAGE_KEY,
      JSON.stringify(records)
    );

    notifyStorageChanged();
  }, [records, loaded]);

  /**
   * 取得今天日期
   */
  const today = useMemo(() => {
    return new Date()
      .toISOString()
      .split("T")[0];
  }, []);

  /**
   * 重新讀取今天已完成健康量測的長者
   *
   * 每位長者的健康紀錄使用：
   * health-records-${elder.id}
   *
   * ElderProfile 目前也是使用這個 Key。
   */
  const loadTodayHealthStatus = () => {
    try {
      const measuredIds: number[] = [];

      localElders.forEach((elder) => {
        const storageKey =
          `health-records-${elder.id}`;

        const saved =
          localStorage.getItem(storageKey);

        if (!saved) {
          return;
        }

        const parsed =
          JSON.parse(saved);

        if (!Array.isArray(parsed)) {
          return;
        }

        const hasTodayRecord =
          parsed.some(
            (record) =>
              record &&
              record.date === today
          );

        if (hasTodayRecord) {
          measuredIds.push(
            Number(elder.id)
          );
        }
      });

      setMeasuredElderIds(
        measuredIds
      );
    } catch (error) {
      console.error(
        "讀取健康量測狀態失敗：",
        error
      );

      setMeasuredElderIds([]);
    }
  };

  /**
   * 長者資料或日期改變時，
   * 重新確認今天的健康量測狀態。
   */
  useEffect(() => {
    loadTodayHealthStatus();
  }, [localElders, today]);

  /**
   * 當健康資料發生變化時，
   * 同步更新「尚未測量／已測量」狀態。
   */
  useEffect(() => {
    const handleStorageChanged = () => {
      loadTodayHealthStatus();
    };

    window.addEventListener(
      "storage",
      handleStorageChanged
    );

    const removeListener =
      addStorageChangedListenerSafe(
        handleStorageChanged
      );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChanged
      );

      removeListener();
    };
  }, [localElders, today]);

  const todayRecords =
    useMemo(() => {
      return records.filter(
        (record) =>
          record.date === today
      );
    }, [records, today]);
    console.log(
  "🔍 Attendance Debug",
  {
    today,
    records,
    todayRecords,
  }
);

  /**
   * 判斷今天是否已完成健康量測
   */
  const hasMeasuredToday = (
    elderId: number
  ) => {
    return measuredElderIds.includes(
      Number(elderId)
    );
  };

  /**
   * 簽到
   */
  const handleCheckIn = (
    elder: Elder
  ) => {
    const exists =
      todayRecords.some(
        (record) =>
          record.elderId === elder.id
      );

    /**
     * 已經簽到：
     *
     * 不重新建立簽到資料，
     * 但仍然允許進入健康量測。
     */
    if (exists) {
      onCheckInSuccess?.(elder);
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

    /**
     * 簽到當下立即寫入 LocalStorage。
     *
     * 不等待 records 的 useEffect，
     * 避免簽到後立即切換頁面造成資料遺失。
     */
    try {
      const saved =
        localStorage.getItem(
          ATTENDANCE_STORAGE_KEY
        );

      const existingRecords =
        saved
          ? JSON.parse(saved)
          : [];

      const safeRecords =
        Array.isArray(existingRecords)
          ? existingRecords
          : [];

      const updatedRecords = [
        newRecord,
        ...safeRecords,
      ];

      localStorage.setItem(
        ATTENDANCE_STORAGE_KEY,
        JSON.stringify(
          updatedRecords
        )
      );

      setRecords(updatedRecords);

      notifyStorageChanged();
    } catch (error) {
      console.error(
        "儲存簽到資料失敗：",
        error
      );

      alert(
        "簽到資料儲存失敗，請稍後再試。"
      );

      return;
    }

    setKeyword("");

    /**
     * 簽到成功後，
     * 可以立即進入健康量測。
     */
    onCheckInSuccess?.(elder);
  };

  /**
   * 新增長者並立即簽到
   */
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

  /**
   * 刪除簽到紀錄
   */
  const handleDelete = (
    id: string
  ) => {
    setRecords((prev) => {
      const updatedRecords =
        prev.filter(
          (record) =>
            record.id !== id
        );

      localStorage.setItem(
        ATTENDANCE_STORAGE_KEY,
        JSON.stringify(
          updatedRecords
        )
      );

      notifyStorageChanged();

      return updatedRecords;
    });
  };

  /**
   * 搜尋長者
   */
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
              const checked = todayRecords.some(
  (record) =>
    String(record.elderName).trim() ===
    String(elder.name).trim()
);
                const measured =
                  hasMeasuredToday(
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
                        measured
                          ? "#F0FDF4"
                          : checked
                          ? "#FFF7ED"
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

                      {checked && (
                        <div
                          style={{
                            marginTop: 8,
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: 6,
                            padding:
                              "4px 9px",
                            borderRadius:
                              999,
                            background:
                              measured
                                ? "#DCFCE7"
                                : "#FFEDD5",
                            color:
                              measured
                                ? "#166534"
                                : "#C2410C",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {measured
                            ? "🟢 已測量"
                            : "🟠 尚未測量"}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 8,
                        flexWrap:
                          "wrap",
                        justifyContent:
                          "flex-end",
                      }}
                    >
                      {!checked ? (
                        <button
                          type="button"
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
                              colors.primary,
                            color:
                              "#fff",
                            cursor:
                              "pointer",
                            fontWeight: 600,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          簽到
                        </button>
                      ) : (
                        <>
                          <span
                            style={{
                              border:
                                "none",
                              borderRadius:
                                radius.md,
                              padding:
                                "9px 14px",
                              background:
                                "#D1FAE5",
                              color:
                                "#065F46",
                              fontWeight: 700,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            ✓ 已簽到
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              onCheckInSuccess?.(
                                elder
                              )
                            }
                            style={{
                              border:
                                "none",
                              borderRadius:
                                radius.md,
                              padding:
                                "9px 16px",
                              background:
                                measured
                                  ? "#166534"
                                  : "#F97316",
                              color:
                                "#fff",
                              cursor:
                                "pointer",
                              fontWeight: 700,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {measured
                              ? "查看健康量測"
                              : "進入健康量測"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      )}

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

      <AttendanceTable
        records={todayRecords}
        onDelete={
          handleDelete
        }
      />
    </div>
  );
}


/**
 * 安全包裝 storage changed listener。
 *
 * 如果目前專案的 storageEvents.ts 已提供
 * addStorageChangedListener，
 * 就使用它同步健康量測狀態。
 */
const addStorageChangedListenerSafe = (
  callback: () => void
) => {
  try {
    const {
      addStorageChangedListener,
    } = require(
      "../utils/storageEvents"
    ) as {
      addStorageChangedListener?: (
        callback: () => void
      ) => () => void;
    };

    if (
      typeof addStorageChangedListener ===
      "function"
    ) {
      return addStorageChangedListener(
        callback
      );
    }
  } catch (error) {
    console.error(
      "讀取 storageEvents 失敗：",
      error
    );
  }

  return () => {};
};


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