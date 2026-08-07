"use client";

import { colors } from "../styles/theme";

export type MenuType =
  | "dashboard"
  | "elder"
  | "health"
  | "course"
  | "activity"
  | "setting";

type Props = {
  selectedMenu: MenuType;
  onMenuChange: (
    menu: MenuType
  ) => void;
};

const menus: {
  key: MenuType;
  icon: string;
  label: string;
}[] = [
  {
    key: "dashboard",
    icon: "🏠",
    label: "首頁",
  },
  {
    key: "elder",
    icon: "👥",
    label: "長者管理",
  },
  {
    key: "health",
    icon: "❤️",
    label: "健康量測",
  },
  {
    key: "course",
    icon: "📚",
    label: "課程管理",
  },
  {
    key: "activity",
    icon: "📅",
    label: "活動管理",
  },
  {
    key: "setting",
    icon: "⚙️",
    label: "系統設定",
  },
];

export default function Sidebar({
  selectedMenu,
  onMenuChange,
}: Props) {
  return (
    <aside
      style={{
        width: 250,
        minHeight: "100vh",
        background: colors.primary,
        color: "#fff",
        padding: 24,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 24,
          fontSize: 28,
        }}
      >
        SilverCare
      </h2>

      <div
        style={{
          height: 1,
          background:
            "rgba(255,255,255,.2)",
          marginBottom: 24,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
               {menus.map((menu) => {
          const active =
            selectedMenu ===
            menu.key;

          return (
            <button
              key={menu.key}
              onClick={() =>
                onMenuChange(
                  menu.key
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding:
                  "12px 16px",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                background: active
                  ? "#ffffff"
                  : "transparent",
                color: active
                  ? colors.primary
                  : "#ffffff",
                fontSize: 16,
                fontWeight: active
                  ? 700
                  : 500,
                transition:
                  "all .2s",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                }}
              >
                {menu.icon}
              </span>

              <span>
                {menu.label}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 24,
          fontSize: 12,
          color:
            "rgba(255,255,255,.65)",
        }}
      >
        SilverCare v0.7
      </div>
    </aside>
  );
} 