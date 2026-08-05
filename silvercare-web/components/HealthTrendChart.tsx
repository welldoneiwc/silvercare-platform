"use client";

import { useMemo } from "react";

import { HealthRecord } from "./ElderProfile";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

type Props = {
  records: HealthRecord[];
};

export default function HealthTrendChart({
  records,
}: Props) {
  const chartData = useMemo(() => {
    return [...records]
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      )
      .slice(-7);
  }, [records]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) {
      return 180;
    }

    return Math.max(
      ...chartData.flatMap((item) => [
        item.systolic,
        item.diastolic,
      ]),
      180
    );
  }, [chartData]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        padding: 24,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 24,
          color: colors.primary,
        }}
      >
        血壓趨勢（最近 7 筆）
      </h3>

      {chartData.length === 0 ? (
        <div
          style={{
            height: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.textLight,
          }}
        >
          尚無健康紀錄
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            height: 240,
          }}
        >
          {chartData.map((record) => {
            const systolicHeight =
              (record.systolic / maxValue) *
              180;

            const diastolicHeight =
              (record.diastolic / maxValue) *
              180;

            return (
              <div
                key={record.id}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 6,
                    height: 180,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height:
                        systolicHeight,
                      background:
                        colors.primary,
                      borderRadius: 4,
                    }}
                  />

                  <div
                    style={{
                      width: 18,
                      height:
                        diastolicHeight,
                      background:
                        "#60A5FA",
                      borderRadius: 4,
                    }}
                  />
                </div>
                                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: colors.textLight,
                    textAlign: "center",
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    {record.date.slice(5)}
                  </div>

                  <div>
                    {record.systolic}/
                    {record.diastolic}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          marginTop: 24,
          fontSize: 13,
          color: colors.textLight,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: colors.primary,
            }}
          />

          <span>收縮壓</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: "#60A5FA",
            }}
          />

          <span>舒張壓</span>
        </div>
      </div>
    </div>
  );
}