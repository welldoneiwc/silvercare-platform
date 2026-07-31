"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AddHealthRecordModal from "./AddHealthRecordModal";
import HealthRecordTable from "./HealthRecordTable";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

export type HealthRecord = {
  id: number;
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  height: number;
  weight: number;
};

type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};

type Props = {
  elder: Elder | null;
};

export default function ElderProfile({
  elder,
}: Props) {
  const [records, setRecords] =
    useState<HealthRecord[]>([]);

  const [openModal, setOpenModal] =
    useState(false);

  /**
   * 固定目前長者的 LocalStorage Key
   * 之後所有讀寫都使用同一個 key
   */
  const storageKey = useMemo(() => {
  console.log("elder =", elder);

  if (!elder) return null;

  console.log(
    "storageKey =",
    `health-records-${elder.id}`
  );

  return `health-records-${elder.id}`;
}, [elder?.id]);

  /**
   * 長者切換時
   * 只讀一次 LocalStorage
   */
  useEffect(() => {
    if (!storageKey) {
      setRecords([]);
      return;
    }

    try {
      const saved =
        localStorage.getItem(storageKey);

      if (!saved) {
        setRecords([]);
        return;
      }

      const parsed =
        JSON.parse(saved) as HealthRecord[];

      setRecords(parsed);
    } catch (error) {
      console.error(error);
      setRecords([]);
    }
  }, [storageKey]);

  /**
   * records 改變才寫入
   */
  useEffect(() => {
    if (!storageKey) return;

    localStorage.setItem(
      storageKey,
      JSON.stringify(records)
    );
  }, [records, storageKey]);

  const latestRecord = useMemo(() => {
    if (records.length === 0) return null;

    return [...records].sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    )[0];
  }, [records]);

  const age = useMemo(() => {
    if (!elder) return "-";

    const today = new Date();

    const birthday = new Date(
      elder.birthday
    );

    let years =
      today.getFullYear() -
      birthday.getFullYear();

    const month =
      today.getMonth() -
      birthday.getMonth();

    if (
      month < 0 ||
      (month === 0 &&
        today.getDate() <
          birthday.getDate())
    ) {
      years--;
    }

    return years;
  }, [elder]);

  const bmi = useMemo(() => {
    if (!latestRecord) return "-";

    const height =
      latestRecord.height / 100;

    if (height <= 0) return "-";

    return (
      latestRecord.weight /
      (height * height)
    ).toFixed(1);
  }, [latestRecord]);

  if (!elder) {
    return (
      <div
        style={{
          flex: 1,
          background: "#fff",
          borderRadius: radius.lg,
          boxShadow: shadow.md,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: colors.textLight,
          fontSize: 16,
        }}
      >
        請先選擇一位長者
      </div>
    );
  }
    return (
    <>
      <div
        style={{
          flex: 1,
          background: "#fff",
          borderRadius: radius.lg,
          boxShadow: shadow.md,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: colors.primary,
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              {elder.name}
            </h2>

            <div
              style={{
                marginTop: 8,
                color: colors.textLight,
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              <div>性別：{elder.gender}</div>
              <div>生日：{elder.birthday}</div>
              <div>年齡：{age} 歲</div>
              <div>電話：{elder.phone}</div>
            </div>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            style={{
              background: colors.primary,
              color: "#fff",
              border: "none",
              borderRadius: radius.md,
              padding: "10px 18px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ＋ 新增健康紀錄
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#F7FAFC",
              borderRadius: radius.md,
              padding: 18,
            }}
          >
            <div
              style={{
                color: colors.textLight,
                fontSize: 13,
              }}
            >
              身高
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 700,
                color: colors.primary,
              }}
            >
              {latestRecord
                ? `${latestRecord.height} cm`
                : "-"}
            </div>
          </div>

          <div
            style={{
              background: "#F7FAFC",
              borderRadius: radius.md,
              padding: 18,
            }}
          >
            <div
              style={{
                color: colors.textLight,
                fontSize: 13,
              }}
            >
              體重
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 700,
                color: colors.primary,
              }}
            >
              {latestRecord
                ? `${latestRecord.weight} kg`
                : "-"}
            </div>
          </div>

          <div
            style={{
              background: "#F7FAFC",
              borderRadius: radius.md,
              padding: 18,
            }}
          >
            <div
              style={{
                color: colors.textLight,
                fontSize: 13,
              }}
            >
              BMI
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 700,
                color: colors.primary,
              }}
            >
              {bmi}
            </div>
          </div>

          <div
            style={{
              background: "#F7FAFC",
              borderRadius: radius.md,
              padding: 18,
            }}
          >
            <div
              style={{
                color: colors.textLight,
                fontSize: 13,
              }}
            >
              最新血壓
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 24,
                fontWeight: 700,
                color: colors.primary,
              }}
            >
              {latestRecord
                ? `${latestRecord.systolic}/${latestRecord.diastolic}`
                : "-"}
            </div>

            <div
              style={{
                marginTop: 6,
                color: colors.textLight,
                fontSize: 13,
              }}
            >
              {latestRecord
                ? `脈搏 ${latestRecord.pulse} bpm`
                : ""}
            </div>
          </div>
        </div>

        <HealthRecordTable
          records={records}
        />
      </div>
            <AddHealthRecordModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={(record) => {
          const newRecord: HealthRecord = {
            id: Date.now(),
            ...record,
          };

          setRecords((prev) => [
            newRecord,
            ...prev,
          ]);

          setOpenModal(false);
        }}
      />
    </>
  );
}