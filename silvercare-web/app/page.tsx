"use client";

import { useState } from "react";

import { colors } from "../styles/theme";
import Sidebar from "../components/Sidebar";
import ElderList from "../components/ElderList";
import type { Elder } from "../components/ElderList";
import ElderProfile from "../components/ElderProfile";

export default function Home() {
  const [selectedElder, setSelectedElder] =
    useState<Elder | null>(null);

  return (
    <div
      style={{
        display: "flex",
        background: colors.background,
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "40px",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            color: colors.title,
            marginBottom: "8px",
          }}
        >
          SilverCare 智慧據點管理平台
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: "16px",
            marginBottom: "32px",
          }}
        >
          讓科技做行政，讓人陪伴人。
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              長者人數
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                marginTop: "8px",
              }}
            >
              58
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              今日課程
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                marginTop: "8px",
              }}
            >
              3
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              今日量測
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                marginTop: "8px",
              }}
            >
              45
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              今日簽到
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                marginTop: "8px",
              }}
            >
              52
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: selectedElder
              ? "1.2fr 1fr"
              : "1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <ElderList
            onSelectElder={setSelectedElder}
          />

         {selectedElder && (
  <ElderProfile
    elder={selectedElder}
  />
)}
        </div>
      </main>
    </div>
  );
}