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

export type AttendanceRecord = {
  id: string;
  elderId: number;
  elderName: string;
  date: string;
  checkInTime: string;
  status: "出席" | "請假" | "缺席";
};

type Elder = {
  id: number;
  name: string;
};

type Props = {
  elders: Elder[];
};

export default function AttendanceSection({
  elders,
}: Props) {
  const [records, setRecords] =
    useState<AttendanceRecord[]>([]);

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
              minute:
                "2-digit",
            }
          ),
        status: "出席",
      };

    setRecords((prev) => [
      newRecord,
      ...prev,
    ]);

    notifyStorageChanged();
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

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {elders.map((elder) => {
          const checked =
            todayRecords.some(
              (record) =>
                record.elderId ===
                elder.id
            );

          return (
            <button
              key={elder.id}
              disabled={checked}
              onClick={() =>
                handleCheckIn(
                  elder
                )
              }
              style={{
                padding:
                  "10px 18px",
                border: "none",
                borderRadius:
                  radius.md,
                background: checked
                  ? "#D1FAE5"
                  : colors.primary,
                color: checked
                  ? "#065F46"
                  : "#fff",
                cursor: checked
                  ? "default"
                  : "pointer",
                fontWeight: 600,
              }}
            >
              {checked
                ? `✓ ${elder.name}`
                : elder.name}
            </button>
          );
        })}
              </div>

      <AttendanceTable
        records={todayRecords}
        onDelete={handleDelete}
      />
    </div>
  );
}