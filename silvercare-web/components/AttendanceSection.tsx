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
   *
   * 注意：
   * 刪除與新增時都會直接同步 LocalStorage。
   * 這裡只負責一般 state 更新後的同步。
   */
  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      ATTENDANCE_STORAGE_KEY,
      JSON.stringify(records)
    );
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
   * 同步更新量測狀態。
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

  /**
   * 今天的簽到資料
   */
  const todayRecords =
    useMemo(() => {
      return records.filter(
        (record) =>
          record.date === today
      );
    }, [records, today]);

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
   * 判斷今天是否已簽到
   */
  const hasCheckedInToday = (
    elderId: number
  ) => {
    return todayRecords.some(
      (record) =>
        Number(record.elderId) ===
        Number(elderId)
    );
  };

  /**
   * 今天已完成健康量測的人數
   */
  const todayMeasuredCount =
    useMemo(() => {
      return localElders.filter(
        (elder) =>
          hasCheckedInToday(
            elder.id
          ) &&
          hasMeasuredToday(
            elder.id
          )
      ).length;
    }, [
      localElders,
      todayRecords,
      measuredElderIds,
    ]);

  /**
   * 搜尋結果
   *
   * 沒有輸入搜尋文字時，
   * 直接顯示全部長者。
   */
  const displayElders =
    useMemo(() => {
      const search =
        keyword.trim();

      if (!search) {
        return localElders;
      }

      return localElders.filter(
        (elder) => {
          const name =
            elder.name ?? "";

          const phone =
            elder.phone ?? "";

          return (
            name.includes(search) ||
            phone.includes(search)
          );
        }
      );
    }, [
      localElders,
      keyword,
    ]);

  /**
   * 簽到
   */
  const handleCheckIn = (
    elder: Elder
  ) => {
    const exists =
      todayRecords.some(
        (record) =>
          Number(record.elderId) ===
          Number(elder.id)
      );

    /**
     * 已經簽到：
     * 不重新建立紀錄，
     * 直接進入健康量測。
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

      /**
       * 先直接寫入 LocalStorage。
       */
      localStorage.setItem(
        ATTENDANCE_STORAGE_KEY,
        JSON.stringify(
          updatedRecords
        )
      );

      /**
       * 再更新 React state。
       */
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
  elder_type: "出席型",
  living_status: "一般",
  contact_method: "電話",
  emergency_contact_name: "",
  emergency_contact_relation: "",
  emergency_contact_phone: "",
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
   *
   * 重要：
   * 不使用 setRecords(prev => ...) 裡面
   * 再處理 LocalStorage。
   *
   * 先讀取目前 LocalStorage，
   * 確實刪除指定 id，
   * 寫回 LocalStorage，
   * 最後才更新畫面。
   */
  const handleDelete = (
    id: string
  ) => {
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
          ? (existingRecords as AttendanceRecord[])
          : [];

      const updatedRecords =
        safeRecords.filter(
          (record) =>
            String(record.id) !==
            String(id)
        );

      /**
       * 先確實寫入刪除後的資料。
       */
      localStorage.setItem(
        ATTENDANCE_STORAGE_KEY,
        JSON.stringify(
          updatedRecords
        )
      );
      console.log(
  "🗑️ DELETE AFTER:",
  updatedRecords
);

      /**
       * 再更新 React 畫面。
       */
      setRecords(
        updatedRecords
      );

      notifyStorageChanged();
    } catch (error) {
      console.error(
        "刪除簽到紀錄失敗：",
        error
      );

      alert(
        "刪除簽到紀錄失敗，請稍後再試。"
      );
    }
  };

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
      {/* ================================
          標題區
      ================================= */}
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

            <span
              style={{
                marginLeft: 12,
              }}
            >
              今日已測量：
              {todayMeasuredCount} 人
            </span>
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
          新增長者
        </button>
      </div>

      {/* ================================
          狀態圖例
      ================================= */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
          padding:
            "12px 18px",
          background:
            "#F8FAFC",
          border:
            "1px solid #E5E7EB",
          borderRadius:
            radius.md,
          fontSize: 14,
          color:
            colors.primary,
        }}
      >
        <span
          style={{
            display:
              "inline-flex",
            alignItems:
              "center",
            gap: 7,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius:
                "50%",
              background:
                "#22C55E",
              display:
                "inline-block",
            }}
          />
          已測量
        </span>

        <span
          style={{
            display:
              "inline-flex",
            alignItems:
              "center",
            gap: 7,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius:
                "50%",
              background:
                "#F97316",
              display:
                "inline-block",
            }}
          />
          尚未測量
        </span>

        <span
          style={{
            display:
              "inline-flex",
            alignItems:
              "center",
            gap: 7,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius:
                "50%",
              background:
                "#10B981",
              display:
                "inline-block",
            }}
          />
          已簽到
        </span>

        <span
          style={{
            display:
              "inline-flex",
            alignItems:
              "center",
            gap: 7,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius:
                "50%",
              background:
                "#D1D5DB",
              display:
                "inline-block",
            }}
          />
          尚未簽到
        </span>
      </div>

      {/* ================================
          新增長者
      ================================= */}
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
          新增長者並立即簽到
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

      {/* ================================
          可選快速搜尋
      ================================= */}
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

          <span
            style={{
              marginLeft: 8,
              color:
                colors.textLight,
              fontWeight: 400,
            }}
          >
            （可選）
          </span>
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(e) =>
            setKeyword(
              e.target.value
            )
          }
          placeholder="輸入姓名或電話快速找人..."
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

      {/* ================================
          今日長者總表
      ================================= */}
      <div
        style={{
          border:
            "1px solid #E5E7EB",
          borderRadius:
            radius.md,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1.4fr 1fr 1fr 1.1fr",
            gap: 16,
            padding:
              "14px 18px",
            background:
              "#F8FAFC",
            borderBottom:
              "1px solid #E5E7EB",
            fontSize: 14,
            fontWeight: 700,
            color:
              colors.primary,
          }}
        >
          <div>
            長者
          </div>

          <div>
            今日簽到
          </div>

          <div>
            健康量測
          </div>

          <div>
            操作
          </div>
        </div>

        <div
          style={{
            maxHeight:
              "60vh",
            overflowY:
              "auto",
          }}
        >
          {displayElders.length ===
          0 ? (
            <div
              style={{
                padding: 28,
                textAlign:
                  "center",
                color:
                  colors.textLight,
              }}
            >
              找不到符合的長者
            </div>
          ) : (
            displayElders.map(
              (elder) => {
                const checked =
                  hasCheckedInToday(
                    elder.id
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
                        "grid",
                      gridTemplateColumns:
                        "1.4fr 1fr 1fr 1.1fr",
                      gap: 16,
                      alignItems:
                        "center",
                      padding:
                        "16px 18px",
                      borderBottom:
                        "1px solid #E5E7EB",
                      background:
                        measured &&
                        checked
                          ? "#F0FDF4"
                          : checked
                          ? "#FFF7ED"
                          : "#fff",
                    }}
                  >
                    {/* 長者 */}
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

                    {/* 今日簽到 */}
                    <div>
                      {checked ? (
                        <div>
                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: 5,
                              padding:
                                "7px 11px",
                              borderRadius:
                                999,
                              background:
                                "#D1FAE5",
                              color:
                                "#065F46",
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius:
                                  "50%",
                                background:
                                  "#10B981",
                              }}
                            />
                            已簽到
                          </span>

                          {(() => {
                            const record =
                              todayRecords.find(
                                (
                                  item
                                ) =>
                                  Number(
                                    item.elderId
                                  ) ===
                                  Number(
                                    elder.id
                                  )
                              );

                            return record ? (
                              <div
                                style={{
                                  marginTop: 5,
                                  fontSize: 12,
                                  color:
                                    colors.textLight,
                                }}
                              >
                                {
                                  record.checkInTime
                                }
                              </div>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <span
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: 6,
                            padding:
                              "7px 11px",
                            borderRadius:
                              999,
                            background:
                              "#F3F4F6",
                            color:
                              "#6B7280",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius:
                                "50%",
                              background:
                                "#D1D5DB",
                            }}
                          />
                          尚未簽到
                        </span>
                      )}
                    </div>

                    {/* 健康量測 */}
                    <div>
                      {!checked ? (
                        <span
                          style={{
                            color:
                              "#9CA3AF",
                            fontSize: 14,
                          }}
                        >
                          —
                        </span>
                      ) : (
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
                              999,
                            padding:
                              "7px 12px",
                            background:
                              measured
                                ? "#DCFCE7"
                                : "#FFEDD5",
                            color:
                              measured
                                ? "#166534"
                                : "#C2410C",
                            cursor:
                              "pointer",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-block",
                              width: 8,
                              height: 8,
                              borderRadius:
                                "50%",
                              background:
                                measured
                                  ? "#22C55E"
                                  : "#F97316",
                              marginRight: 7,
                            }}
                          />

                         {measured
  ? "已測量"
  : "尚未測量"}
                        </button>
                      )}
                    </div>

                    {/* 操作 */}
                    <div
                      style={{
                        display:
                          "flex",
                        gap: 8,
                        alignItems:
                          "center",
                        flexWrap:
                          "wrap",
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
                            border:
                              "none",
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
                            fontWeight: 700,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          簽到
                        </button>
                      ) : (
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
                      )}
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </div>

      {/* ================================
          今日簽到紀錄
      ================================= */}
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