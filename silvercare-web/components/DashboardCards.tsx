"use client";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

import { DashboardData } from "../utils/useDashboardData";

type Props = {
  data: DashboardData;
};

type CardItem = {
  title: string;
  value: number;
  color: string;
};

export default function DashboardCards({
  data,
}: Props) {
  const cards: CardItem[] = [
    {
      title: "長者總數",
      value: data.elderCount,
      color: colors.primary,
    },
    {
      title: "今日課程",
      value: data.todayCourseCount,
      color: "#2563EB",
    },
    {
      title: "今日健康量測",
      value: data.todayHealthCount,
      color: "#16A34A",
    },
    {
      title: "今日簽到",
      value: data.todayAttendanceCount,
      color: "#EA580C",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(4, 1fr)",
        gap: 20,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            background: "#fff",
            borderRadius: radius.lg,
            boxShadow: shadow.md,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: colors.textLight,
              fontWeight: 500,
            }}
          >
            {card.title}
          </div>

          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: card.color,
            }}
          >
            {card.value}
          </div>
                    <div
            style={{
              marginTop: "auto",
              fontSize: 13,
              color: colors.textLight,
            }}
          >
            {card.title === "長者總數" &&
              "目前系統內已建立的長者資料"}

            {card.title === "今日課程" &&
              "今天安排的課程數量"}

            {card.title ===
              "今日健康量測" &&
              "今天新增的健康紀錄"}

            {card.title === "今日簽到" &&
              "今天完成簽到的人數"}
          </div>
        </div>
      ))}
    </div>
  );
}
