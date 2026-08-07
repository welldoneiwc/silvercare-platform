"use client";

import { useState } from "react";

import { colors } from "../styles/theme";

import Sidebar, {
  MenuType,
} from "../components/Sidebar";

import ElderList from "../components/ElderList";
import type { Elder } from "../components/ElderList";

import ElderProfile from "../components/ElderProfile";
import CourseSection from "../components/CourseSection";

import { useDashboardData } from "../utils/useDashboardData";

export default function Home() {
  const [selectedMenu, setSelectedMenu] =
    useState<MenuType>("elder");

  const [selectedElder, setSelectedElder] =
    useState<Elder | null>(null);

  const dashboardData =
    useDashboardData();

  return (
    <div
      style={{
        display: "flex",
        background: colors.background,
        minHeight: "100vh",
      }}
    >
      <Sidebar
        selectedMenu={selectedMenu}
        onMenuChange={setSelectedMenu}
      />

      <main
        style={{
          flex: 1,
          padding: 40,
        }}
      >
        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: colors.title,
            marginBottom: 8,
          }}
        >
          SilverCare 智慧據點管理平台
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: 16,
            marginBottom: 32,
          }}
        >
          讓科技做行政，讓人陪伴人。
        </p>

        {selectedMenu === "dashboard" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4,1fr)",
                gap: 20,
                marginBottom: 32,
              }}
            >
                        <div
                style={cardStyle}
              >
                <div style={labelStyle}>
                  長者人數
                </div>

                <div style={valueStyle}>
                  {
                    dashboardData.elderCount
                  }
                </div>
              </div>

              <div
                style={cardStyle}
              >
                <div style={labelStyle}>
                  今日課程
                </div>

                <div style={valueStyle}>
                  {
                    dashboardData.todayCourseCount
                  }
                </div>
              </div>

              <div
                style={cardStyle}
              >
                <div style={labelStyle}>
                  今日量測
                </div>

                <div style={valueStyle}>
                  {
                    dashboardData.todayHealthCount
                  }
                </div>
              </div>

              <div
                style={cardStyle}
              >
                <div style={labelStyle}>
                  今日簽到
                </div>

                <div style={valueStyle}>
                  {
                    dashboardData.todayAttendanceCount
                  }
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 40,
                textAlign: "center",
              }}
            >
              <h2>
                歡迎使用 SilverCare
              </h2>

              <p>
                請由左側功能選單開始管理據點資料。
              </p>
            </div>
          </>
        )}

        {selectedMenu === "elder" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                selectedElder
                  ? "1.2fr 1fr"
                  : "1fr",
              gap: 24,
              alignItems: "start",
            }}
          >
            <ElderList
              onSelectElder={
                setSelectedElder
              }
            />

            {selectedElder && (
              <ElderProfile
                elder={
                  selectedElder
                }
              />
            )}
          </div>
        )}

        {selectedMenu ===
          "course" && (
          <CourseSection />
        )}

        {selectedMenu ===
          "health" && (
          <div
            style={{
              background: "#fff",
              padding: 40,
              borderRadius: 16,
            }}
          >
            <h2>
              ❤️ 健康量測
            </h2>

            <p>
              下一階段將整合健康紀錄總覽。
            </p>
          </div>
        )}

        {selectedMenu ===
          "activity" && (
          <div
            style={{
              background: "#fff",
              padding: 40,
              borderRadius: 16,
            }}
          >
            <h2>
              📅 活動管理
            </h2>

            <p>
              建置中...
            </p>
          </div>
        )}    
                {selectedMenu ===
          "setting" && (
          <div
            style={{
              background: "#fff",
              padding: 40,
              borderRadius: 16,
            }}
          >
            <h2>
              ⚙️ 系統設定
            </h2>

            <p>
              建置中...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.06)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
};

const valueStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  marginTop: 8,
};