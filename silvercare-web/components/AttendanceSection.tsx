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

export default function AttendanceSection({
  elders,
  onCheckInSuccess,
}: Props) {
  const [records, setRecords] =
    useState<AttendanceRecord[]>([]);

  const [keyword, setKeyword] =
    useState("");

  const storageKey =
    "attendance-records";

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

      setRecords(
        JSON.parse(saved)
      );
    } catch (error) {
      console.error(error);
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
          record.elderId ===
          elder.id
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

      return elders.filter(
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
    }, [elders, keyword]);

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
        }}
      >
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
            color:
              colors.textLight,
            fontSize: 14,
          }}
        >
          今日已簽到：
          {todayRecords.length} 人
        </div>
      </div>

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
            boxSizing: "border-box",
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
                textAlign: "center",
                background:
                  "#F7FAFC",
                borderRadius:
                  radius.md,
                color:
                  colors.textLight,
              }}
            >
              找不到符合的長者
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
                    key={elder.id}
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
                        {elder.name}
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
                          {elder.phone}
                        </div>
                      )}
                    </div>

                    <button
                      disabled={checked}
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

      {!keyword.trim() && (
        <div
          style={{
            padding: 28,
            textAlign: "center",
            background: "#F7FAFC",
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
        onDelete={handleDelete}
      />
    </div>
  );
}