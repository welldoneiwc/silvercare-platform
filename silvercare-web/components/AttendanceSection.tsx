"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

import {
  addStorageChangedListener,
  notifyStorageChanged,
} from "../utils/storageEvents";

import { supabase } from "../utils/supabase";

import AttendanceTable from "./AttendanceTable";
import type { Elder } from "./ElderList";

export type AttendanceRecord = {
  id: string;
  elderId: number;
  elderName: string;
  date: string;
  checkInTime: string;
  status: "出席" | "請假" | "缺席";
  isUnregistered?: boolean;
  phone?: string;
};

type Props = {
  elders: Elder[];
  onCheckInSuccess?: (
    elder: Elder
  ) => void;
};

type NewElderForm = {
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};

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

  const [
    measuredElderIds,
    setMeasuredElderIds,
  ] = useState<number[]>([]);

  /**
   * 從 Supabase 載入長者
   */
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
          "讀取簽到長者資料失敗：",
          error
        );

        setLocalElders([]);
        return;
      }

      const safeData: Elder[] =
        (data ?? []).map(
          (item) => ({
            id: Number(item.id),
            name:
              item.name ?? "",
            gender:
              item.gender ?? "",
            birthday:
              item.birthday ?? "",
            phone:
              item.phone ?? "",
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

      setLocalElders(
        safeData
      );
    } catch (error) {
      console.error(
        "讀取簽到長者資料發生錯誤：",
        error
      );

      setLocalElders([]);
    }
  };

  useEffect(() => {
    loadElders();
  }, []);

  /**
   * 保留父層傳入資料作為備援。
   */
  useEffect(() => {
    if (
      localElders.length === 0 &&
      elders.length > 0
    ) {
      setLocalElders(elders);
    }
  }, [
    elders,
    localElders.length,
  ]);

  /**
   * 載入簽到紀錄
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
   * 同步簽到資料
   */
  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      ATTENDANCE_STORAGE_KEY,
      JSON.stringify(records)
    );
  }, [
    records,
    loaded,
  ]);

  /**
   * 今天日期
   */
  const today = useMemo(() => {
    return new Date()
      .toISOString()
      .split("T")[0];
  }, []);

  /**
   * 載入今日健康量測狀態
   */
  const loadTodayHealthStatus = () => {
    try {
      const measuredIds: number[] =
        [];

      localElders.forEach(
        (elder) => {
          const storageKey =
            `health-records-${elder.id}`;

          const saved =
            localStorage.getItem(
              storageKey
            );

          if (!saved) {
            return;
          }

          const parsed =
            JSON.parse(saved);

          if (
            !Array.isArray(parsed)
          ) {
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
        }
      );

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

  useEffect(() => {
    loadTodayHealthStatus();
  }, [
    localElders,
    today,
  ]);

  /**
   * 健康資料變更時同步
   */
  useEffect(() => {
    const handleStorageChanged =
      () => {
        loadTodayHealthStatus();
      };

    window.addEventListener(
      "storage",
      handleStorageChanged
    );

    const removeListener =
      addStorageChangedListener(
        handleStorageChanged
      );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChanged
      );

      removeListener();
    };
  }, [
    localElders,
    today,
  ]);

  /**
   * 今天簽到
   */
  const todayRecords =
    useMemo(() => {
      return records.filter(
        (record) =>
          record.date === today
      );
    }, [
      records,
      today,
    ]);

  /**
   * 判斷今天是否已測量
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
        Number(
          record.elderId
        ) ===
        Number(elderId)
    );
  };

  /**
   * 今日已測量人數
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
   * 搜尋長者
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
            name.includes(
              search
            ) ||
            phone.includes(
              search
            )
          );
        }
      );
    }, [
      localElders,
      keyword,
    ]);

    /**
   * 簽到
   *
   * 規則：
   * 1. 同一天 + 相同 elderId → 視為已報到
   * 2. 舊資料 elderId 不一致時，
   *    改用「姓名 + 電話」辨識同一位長者
   * 3. 已報到不新增第二筆
   * 4. 已報到仍可進入健康量測
   */
  const handleCheckIn = (
    elder: Elder
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
        Array.isArray(
          existingRecords
        )
          ? (existingRecords as AttendanceRecord[])
          : [];

      const elderName =
        (elder.name ?? "")
          .trim();

      const elderPhone =
        (elder.phone ?? "")
          .trim();

      /**
       * 只檢查今天的紀錄
       */
      const alreadyCheckedIn =
        safeRecords.some(
          (record) => {
            if (
              record.date !== today
            ) {
              return false;
            }

            /**
             * 第一優先：
             * elderId 相同
             */
            if (
              Number(
                record.elderId
              ) ===
              Number(elder.id)
            ) {
              return true;
            }

            /**
             * 第二優先：
             * 舊資料 ID 不一致時，
             * 使用「姓名 + 電話」
             */
            const recordName =
              (
                record.elderName ??
                ""
              ).trim();

            if (
              recordName !==
              elderName
            ) {
              return false;
            }

            /**
             * 舊簽到資料的 AttendanceRecord
             * 目前沒有 phone 欄位。
             *
             * 因此只有姓名可以作為舊資料
             * 的相容判斷。
             *
             * 新資料則仍以 elderId 為
             * 最可靠的唯一辨識。
             */
            if (
              !elderPhone
            ) {
              return false;
            }

            return (
              recordName ===
              elderName
            );
          }
        );

      /**
       * 今天已經簽到：
       * 不新增第二筆。
       *
       * 仍然進入健康量測。
       */
      if (
        alreadyCheckedIn
      ) {
        setKeyword("");

        onCheckInSuccess?.(
          elder
        );

        return;
      }

      const now =
        new Date();

      const newRecord:
        AttendanceRecord = {
        id:
          crypto.randomUUID(),
        elderId:
          elder.id,
        elderName:
          elder.name,
        date:
          today,
        checkInTime:
          now.toLocaleTimeString(
            "zh-TW",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
        status:
          "出席",
      };

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

      setRecords(
        updatedRecords
      );

      notifyStorageChanged();

      setKeyword("");

      onCheckInSuccess?.(
        elder
      );
    } catch (error) {
      console.error(
        "儲存簽到資料失敗：",
        error
      );

      alert(
        "簽到資料儲存失敗，請稍後再試。"
      );
    }
  };
        /**
   * 未建檔長者現場報到
   *
   * 不建立長者管理資料，
   * 只先建立今天的簽到紀錄。
   */
  const handleUnregisteredCheckIn =
    () => {
      const defaultName =
        keyword.trim();

      const nameInput =
        window.prompt(
          "請輸入長者姓名：",
          defaultName
        );

      if (
        nameInput === null
      ) {
        return;
      }

      const name =
        nameInput.trim();

      if (!name) {
        alert(
          "請輸入長者姓名。"
        );
        return;
      }

      const phoneInput =
        window.prompt(
          "請輸入電話（可留空）：",
          ""
        );

      if (
        phoneInput === null
      ) {
        return;
      }

      const phone =
        phoneInput.trim();

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
          Array.isArray(
            existingRecords
          )
            ? (existingRecords as AttendanceRecord[])
            : [];

        /**
         * 未建檔長者沒有 elderId，
         * 因此使用「姓名 + 電話」
         * 防止同一天重複報到。
         */
        const duplicate =
          safeRecords.some(
            (record) => {
              if (
                record.date !==
                today
              ) {
                return false;
              }

              if (
                !record.isUnregistered
              ) {
                return false;
              }

              const recordName =
                (
                  record.elderName ??
                  ""
                ).trim();

              const recordPhone =
                (
                  record.phone ??
                  ""
                ).trim();

              return (
                recordName ===
                  name &&
                recordPhone ===
                  phone
              );
            }
          );

        if (duplicate) {
          alert(
            "這位長者今天已經報到過了。"
          );

          setKeyword("");

          return;
        }

        const now =
          new Date();

        const newRecord:
          AttendanceRecord = {
          id:
            crypto.randomUUID(),
          elderId: 0,
          elderName: name,
          date: today,
          checkInTime:
            now.toLocaleTimeString(
              "zh-TW",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
          status:
            "出席",
          isUnregistered:
            true,
          phone,
        };

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

        setRecords(
          updatedRecords
        );

        notifyStorageChanged();

        setKeyword("");

        alert(
          "已完成現場報到。\n\n這位長者目前尚未建立長者管理資料，請之後再補登完整資料。"
        );
      } catch (error) {
        console.error(
          "現場報到失敗：",
          error
        );

        alert(
          "現場報到失敗，請稍後再試。"
        );
      }
    };
  /**
   * 新增長者並立即簽到
   */
  const handleAddElder =
    async () => {
      const name =
        newElderForm.name.trim();

      if (!name) {
        alert(
          "請輸入長者姓名。"
        );
        return;
      }

      if (
        !newElderForm.birthday
      ) {
        alert(
          "請輸入出生日期。"
        );
        return;
      }

      if (
        !newElderForm.phone.trim()
      ) {
        alert(
          "請輸入電話。"
        );
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
        const {
          data,
          error,
        } = await supabase
          .from("elders")
          .insert({
            name,
            gender:
              newElderForm.gender.trim(),
            birthday:
              newElderForm.birthday,
            phone:
              newElderForm.phone.trim(),
            elder_type:
              "出席型",
            living_status:
              "一般",
            contact_method:
              "電話",
            emergency_contact_name:
              "",
            emergency_contact_relation:
              "",
            emergency_contact_phone:
              "",
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
            error
          );

          alert(
            `新增長者失敗：${error.message}`
          );

          return;
        }

        if (!data) {
          alert(
            "新增長者失敗：沒有取得新增資料。"
          );

          return;
        }

        const newElder: Elder = {
          id: Number(
            data.id
          ),
          name:
            data.name ?? "",
          gender:
            data.gender ?? "",
          birthday:
            data.birthday ?? "",
          phone:
            data.phone ?? "",
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

        setLocalElders(
          (prev) => [
            ...prev,
            newElder,
          ]
        );

        setNewElderForm(
          createEmptyElderForm()
        );

        setShowAddElder(
          false
        );

        notifyStorageChanged();

        handleCheckIn(
          newElder
        );
      } catch (error) {
        console.error(
          "新增長者發生錯誤：",
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
        Array.isArray(
          existingRecords
        )
          ? (existingRecords as AttendanceRecord[])
          : [];

      const updatedRecords =
        safeRecords.filter(
          (record) =>
            String(
              record.id
            ) !==
            String(id)
        );

      localStorage.setItem(
        ATTENDANCE_STORAGE_KEY,
        JSON.stringify(
          updatedRecords
        )
      );

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
    <>
      <style>{`
        .silvercare-attendance-desktop {
          display: block;
        }

        .silvercare-attendance-mobile {
          display: none;
        }

        .silvercare-attendance-legend {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .silvercare-attendance-table-header,
        .silvercare-attendance-table-row {
          display: grid;
          grid-template-columns:
            1.4fr 1fr 1fr 1.1fr;
          gap: 16px;
        }

        .silvercare-attendance-table-header {
          padding: 14px 18px;
          background: #F8FAFC;
          border-bottom:
            1px solid #E5E7EB;
          font-size: 14px;
          font-weight: 700;
          color: ${colors.primary};
        }

        .silvercare-attendance-table-row {
          align-items: center;
          padding: 16px 18px;
          border-bottom:
            1px solid #E5E7EB;
        }

        @media (max-width: 767px) {
          .silvercare-attendance-desktop {
            display: none !important;
          }

          .silvercare-attendance-mobile {
            display: block !important;
          }

          .silvercare-attendance-legend {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .silvercare-attendance-mobile-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .silvercare-attendance-mobile-card {
            width: 100%;
            box-sizing: border-box;
            background: #fff;
            border:
              1px solid #E5E7EB;
            border-radius: 14px;
            padding: 16px;
            box-shadow:
              0 2px 8px rgba(0,0,0,0.04);
          }

          .silvercare-attendance-mobile-card-name {
            color: ${colors.primary};
            font-size: 19px;
            line-height: 1.35;
            font-weight: 700;
          }

          .silvercare-attendance-mobile-card-phone {
            margin-top: 4px;
            color: #6B7280;
            font-size: 13px;
          }

          .silvercare-attendance-mobile-status-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 14px;
          }

          .silvercare-attendance-mobile-status-box {
            min-width: 0;
            padding: 11px 12px;
            border-radius: 10px;
            box-sizing: border-box;
          }

          .silvercare-attendance-mobile-status-label {
            font-size: 11px;
            color: #64748B;
            margin-bottom: 5px;
          }

          .silvercare-attendance-mobile-status-value {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            font-size: 14px;
            font-weight: 700;
          }

          .silvercare-attendance-mobile-action {
            margin-top: 14px;
          }

          .silvercare-attendance-mobile-action button {
            width: 100%;
            min-height: 46px;
            border: none;
            border-radius: 10px;
            padding: 10px 16px;
            color: #fff;
            cursor: pointer;
            font-size: 15px;
            font-weight: 700;
          }

          .silvercare-attendance-mobile-records {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>

      <div
        style={{
          background: "#fff",
          borderRadius:
            radius.lg,
          boxShadow:
            shadow.md,
          padding: 24,
          display: "flex",
          flexDirection:
            "column",
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
            alignItems:
              "center",
            gap: 16,
            flexWrap:
              "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color:
                  colors.primary,
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
              {
                todayRecords.length
              } 人

              <span
                style={{
                  marginLeft: 12,
                }}
              >
                今日已測量：
                {
                  todayMeasuredCount
                } 人
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
              cursor:
                "pointer",
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
          className="silvercare-attendance-legend"
          style={{
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
              minWidth: 0,
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
                flex: "0 0 auto",
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
              minWidth: 0,
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
                flex: "0 0 auto",
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
              minWidth: 0,
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
                flex: "0 0 auto",
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
              minWidth: 0,
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
                flex: "0 0 auto",
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
                  style={
                    labelStyle
                  }
                >
                  姓名
                </label>

                <input
                  type="text"
                  value={
                    newElderForm.name
                  }
                  onChange={(
                    event
                  ) =>
                    setNewElderForm(
                      (
                        current
                      ) => ({
                        ...current,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="請輸入姓名"
                  style={
                    inputStyle
                  }
                />
              </div>

              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  性別
                </label>

                <select
                  value={
                    newElderForm.gender
                  }
                  onChange={(
                    event
                  ) =>
                    setNewElderForm(
                      (
                        current
                      ) => ({
                        ...current,
                        gender:
                          event.target
                            .value,
                      })
                    )
                  }
                  style={
                    inputStyle
                  }
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
                  style={
                    labelStyle
                  }
                >
                  生日
                </label>

                <input
                  type="date"
                  value={
                    newElderForm.birthday
                  }
                  onChange={(
                    event
                  ) =>
                    setNewElderForm(
                      (
                        current
                      ) => ({
                        ...current,
                        birthday:
                          event.target
                            .value,
                      })
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  電話
                </label>

                <input
                  type="text"
                  value={
                    newElderForm.phone
                  }
                  onChange={(
                    event
                  ) =>
                    setNewElderForm(
                      (
                        current
                      ) => ({
                        ...current,
                        phone:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="請輸入電話"
                  style={
                    inputStyle
                  }
                />
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",
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
            搜尋長者
        ================================= */}

        <div>
          <div
            style={{
              marginBottom: 8,
              color:
                colors.primary,
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
              outline:
                "none",
            }}
          />
        </div>

        {/* ================================
            桌機版：四欄總表
        ================================= */}

        <div
          className="silvercare-attendance-desktop"
        >
          <div
            style={{
              border:
                "1px solid #E5E7EB",
              borderRadius:
                radius.md,
              overflow: "hidden",
            }}
          >
            <div className="silvercare-attendance-table-header">
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
  <div>
    找不到符合的長者
  </div>

  <button
    type="button"
    onClick={
      handleUnregisteredCheckIn
    }
    style={{
      marginTop: 14,
      border: "none",
      borderRadius:
        radius.md,
      padding:
        "10px 18px",
      background:
        colors.primary,
      color: "#fff",
      cursor:
        "pointer",
      fontWeight: 700,
      fontSize: 14,
    }}
  >
    ＋ 現場新增報到
  </button>
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

                    return (
                      <div
                        key={
                          elder.id
                        }
                        className="silvercare-attendance-table-row"
                        style={{
                          background:
                            measured &&
                            checked
                              ? "#F0FDF4"
                              : checked
                              ? "#FFF7ED"
                              : "#fff",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize:
                                16,
                              fontWeight:
                                700,
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
                                marginTop:
                                  4,
                                fontSize:
                                  13,
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
                                  fontSize:
                                    13,
                                  fontWeight:
                                    700,
                                }}
                              >
                                <span
                                  style={{
                                    width:
                                      8,
                                    height:
                                      8,
                                    borderRadius:
                                      "50%",
                                    background:
                                      "#10B981",
                                  }}
                                />

                                已簽到
                              </span>

                              {record && (
                                <div
                                  style={{
                                    marginTop:
                                      5,
                                    fontSize:
                                      12,
                                    color:
                                      colors.textLight,
                                  }}
                                >
                                  {
                                    record.checkInTime
                                  }
                                </div>
                              )}
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
                                fontSize:
                                  13,
                                fontWeight:
                                  700,
                              }}
                            >
                              <span
                                style={{
                                  width:
                                    8,
                                  height:
                                    8,
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

                        <div>
                          {!checked ? (
                            <span
                              style={{
                                color:
                                  "#9CA3AF",
                                fontSize:
                                  14,
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
                                fontSize:
                                  13,
                                fontWeight:
                                  700,
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    "inline-block",
                                  width:
                                    8,
                                  height:
                                    8,
                                  borderRadius:
                                    "50%",
                                  background:
                                    measured
                                      ? "#22C55E"
                                      : "#F97316",
                                  marginRight:
                                    7,
                                }}
                              />

                              {measured
                                ? "已測量"
                                : "尚未測量"}
                            </button>
                          )}
                        </div>

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
                                fontWeight:
                                  700,
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
                                fontWeight:
                                  700,
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
        </div>

        {/* ================================
            手機版：卡片
        ================================= */}

        <div
          className="silvercare-attendance-mobile"
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
                background:
                  "#F8FAFC",
                borderRadius:
                  radius.md,
              }}
            >
              <div>
                找不到符合的長者
              </div>

              <button
                type="button"
                onClick={
                  handleUnregisteredCheckIn
                }
                style={{
                  marginTop: 14,
                  border: "none",
                  borderRadius:
                    radius.md,
                  padding:
                    "11px 18px",
                  background:
                    colors.primary,
                  color: "#fff",
                  cursor:
                    "pointer",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                ＋ 現場新增報到
              </button>
            </div>
          ) : (
            <div className="silvercare-attendance-mobile-list">
              {displayElders.map(
                (elder) => {
                  const checked =
                    hasCheckedInToday(
                      elder.id
                    );

                  const measured =
                    hasMeasuredToday(
                      elder.id
                    );

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

                  const cardBackground =
                    measured &&
                    checked
                      ? "#F0FDF4"
                      : checked
                      ? "#FFF7ED"
                      : "#FFFFFF";

                  return (
                    <div
                      key={
                        elder.id
                      }
                      className="silvercare-attendance-mobile-card"
                      style={{
                        background:
                          cardBackground,
                      }}
                    >
                      {/* 姓名 */}

                      <div>
                        <div className="silvercare-attendance-mobile-card-name">
                          {
                            elder.name
                          }
                        </div>

                        {elder.phone && (
                          <div className="silvercare-attendance-mobile-card-phone">
                            {
                              elder.phone
                            }
                          </div>
                        )}
                      </div>

                      {/* 狀態 */}

                      <div className="silvercare-attendance-mobile-status-grid">
                        <div
                          className="silvercare-attendance-mobile-status-box"
                          style={{
                            background:
                              checked
                                ? "#ECFDF5"
                                : "#F8FAFC",
                            border:
                              checked
                                ? "1px solid #A7F3D0"
                                : "1px solid #E5E7EB",
                          }}
                        >
                          <div className="silvercare-attendance-mobile-status-label">
                            今日簽到
                          </div>

                          <div
                            className="silvercare-attendance-mobile-status-value"
                            style={{
                              color:
                                checked
                                  ? "#065F46"
                                  : "#6B7280",
                            }}
                          >
                            <span
                              style={{
                                width:
                                  9,
                                height:
                                  9,
                                borderRadius:
                                  "50%",
                                background:
                                  checked
                                    ? "#10B981"
                                    : "#D1D5DB",
                                flex:
                                  "0 0 auto",
                              }}
                            />

                            {checked
                              ? "已簽到"
                              : "尚未簽到"}
                          </div>

                          {record && (
                            <div
                              style={{
                                marginTop:
                                  4,
                                fontSize:
                                  11,
                                color:
                                  colors.textLight,
                              }}
                            >
                              {
                                record.checkInTime
                              }
                            </div>
                          )}
                        </div>

                        <div
                          className="silvercare-attendance-mobile-status-box"
                          style={{
                            background:
                              !checked
                                ? "#F8FAFC"
                                : measured
                                ? "#F0FDF4"
                                : "#FFF7ED",
                            border:
                              !checked
                                ? "1px solid #E5E7EB"
                                : measured
                                ? "1px solid #BBF7D0"
                                : "1px solid #FED7AA",
                          }}
                        >
                          <div className="silvercare-attendance-mobile-status-label">
                            健康量測
                          </div>

                          <div
                            className="silvercare-attendance-mobile-status-value"
                            style={{
                              color:
                                !checked
                                  ? "#9CA3AF"
                                  : measured
                                  ? "#166534"
                                  : "#C2410C",
                            }}
                          >
                            <span
                              style={{
                                width:
                                  9,
                                height:
                                  9,
                                borderRadius:
                                  "50%",
                                background:
                                  !checked
                                    ? "#D1D5DB"
                                    : measured
                                    ? "#22C55E"
                                    : "#F97316",
                                flex:
                                  "0 0 auto",
                              }}
                            />

                            {!checked
                              ? "尚未簽到"
                              : measured
                              ? "已測量"
                              : "尚未測量"}
                          </div>
                        </div>
                      </div>

                      {/* 操作 */}

                      <div className="silvercare-attendance-mobile-action">
                        {!checked ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleCheckIn(
                                elder
                              )
                            }
                            style={{
                              background:
                                colors.primary,
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
                              background:
                                measured
                                  ? "#166534"
                                  : "#F97316",
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
              )}
            </div>
          )}
        </div>

        {/* ================================
            今日簽到紀錄
        ================================= */}

        <div className="silvercare-attendance-mobile-records">
          <AttendanceTable
            records={
              todayRecords
            }
            onDelete={
              handleDelete
            }
          />
        </div>
      </div>
    </>
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
  boxSizing:
    "border-box",
  padding:
    "10px 12px",
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
  padding:
    "11px 18px",
  background:
    colors.primary,
  color: "#fff",
  cursor:
    "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle:
  React.CSSProperties = {
  border:
    "1px solid #D1D5DB",
  borderRadius: 8,
  padding:
    "11px 18px",
  background: "#fff",
  color: "#374151",
  cursor:
    "pointer",
  fontWeight: 600,
};