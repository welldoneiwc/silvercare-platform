"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { colors } from "../styles/theme";
import { supabase } from "../utils/supabase";

export type MenuType =
  | "dashboard"
  | "elder"
  | "attendance"
  | "health"
  | "course"
  | "activity"
  | "finance"
  | "setting";

type Props = {
  selectedMenu: MenuType;
  onMenuChange: (menu: MenuType) => void;
};

const menus: {
  key: MenuType;
  icon: string;
  label: string;
}[] = [
  {
    key: "dashboard",
    icon: "⌂",
    label: "首頁",
  },
  {
    key: "elder",
    icon: "♙",
    label: "長者管理",
  },
  {
    key: "attendance",
    icon: "✓",
    label: "長者簽到",
  },
  {
    key: "health",
    icon: "♡",
    label: "健康量測",
  },
  {
    key: "course",
    icon: "▤",
    label: "課程管理",
  },
  {
    key: "activity",
    icon: "▦",
    label: "活動管理",
  },
  {
    key: "finance",
    icon: "$",
    label: "財務管理",
  },
  {
    key: "setting",
    icon: "⚙",
    label: "系統設定",
  },
];

const mobileMenus: {
  key: MenuType;
  icon: string;
  label: string;
}[] = [
  {
    key: "dashboard",
    icon: "⌂",
    label: "首頁",
  },
  {
    key: "attendance",
    icon: "✓",
    label: "簽到",
  },
  {
    key: "elder",
    icon: "♙",
    label: "長者",
  },
  {
    key: "course",
    icon: "▤",
    label: "課程",
  },
  {
    key: "activity",
    icon: "▦",
    label: "活動",
  },
  {
    key: "finance",
    icon: "$",
    label: "財務",
  },
  {
    key: "health",
    icon: "♡",
    label: "健康",
  },
];

export default function Sidebar({
  selectedMenu,
  onMenuChange,
}: Props) {
  const router = useRouter();

  const [loggingOut, setLoggingOut] =
    useState(false);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    const confirmed =
      window.confirm(
        "確定要登出 SilverCare 嗎？"
      );

    if (!confirmed) {
      return;
    }

    setLoggingOut(true);

    try {
      const {
        error,
      } = await supabase.auth.signOut();

      if (error) {
        console.error(
          "登出失敗：",
          error
        );

        alert(
          "登出失敗，請稍後再試。"
        );

        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "登出發生錯誤：",
        error
      );

      alert(
        "登出發生錯誤，請稍後再試。"
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <style>{`
        .silvercare-desktop-sidebar {
          display: flex;
        }

        .silvercare-mobile-navigation {
          display: none;
        }

        .silvercare-desktop-logout {
          width: 100%;
          margin-top: 16px;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 10px;
          background: transparent;
          color: rgba(255,255,255,.92);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
        }

        .silvercare-desktop-logout:hover {
          background: rgba(255,255,255,.10);
        }

        .silvercare-mobile-logout {
          display: none;
        }

        @media (max-width: 767px) {
          .silvercare-desktop-sidebar {
            display: none !important;
          }

          .silvercare-mobile-navigation {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: calc(76px + env(safe-area-inset-bottom)) !important;
            z-index: 2147483647 !important;
            display: grid !important;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            background: #ffffff;
            border-top: 1px solid #e5e7eb;
            box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.08);
            padding: 6px 4px env(safe-area-inset-bottom);
            box-sizing: border-box;
            pointer-events: auto !important;
            touch-action: manipulation !important;
            isolation: isolate;
          }

          .silvercare-mobile-navigation button {
            appearance: none;
            -webkit-appearance: none;
            position: relative;
            z-index: 2147483647;
            min-width: 0;
            width: 100%;
            height: 64px;
            border: none;
            outline: none;
            background: transparent;
            color: #9ca3af;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 4px 2px;
            margin: 0;
            cursor: pointer;
            pointer-events: auto !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            -webkit-user-select: none;
            font-family:
              Arial,
              "Noto Sans TC",
              "Noto Sans",
              sans-serif;
          }

          .silvercare-mobile-navigation button:active {
            background: #E5F3EF !important;
            transform: scale(0.94);
          }

          .silvercare-mobile-navigation button.active {
            color: ${colors.primary};
            font-weight: 700;
          }

          .silvercare-mobile-navigation-icon {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 25px;
            line-height: 1;
            font-family:
              Arial,
              "Noto Sans",
              sans-serif;
            pointer-events: none;
          }

          .silvercare-mobile-navigation-label {
            font-size: 11px;
            line-height: 1.2;
            white-space: nowrap;
            pointer-events: none;
          }

          .silvercare-mobile-navigation button.active
            .silvercare-mobile-navigation-icon {
            font-weight: 700;
          }

          .silvercare-mobile-logout {
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 2147483646;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            min-width: 56px;
            height: 38px;
            padding: 0 10px;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            background: rgba(255,255,255,.96);
            box-shadow: 0 3px 12px rgba(0,0,0,.10);
            color: #374151;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            backdrop-filter: blur(6px);
          }

          .silvercare-mobile-logout:active {
            transform: scale(0.96);
          }
        }
      `}</style>

      <aside
        className="silvercare-desktop-sidebar"
        style={{
          width: 250,
          minWidth: 250,
          minHeight: "100vh",
          background:
            colors.primary,
          color: "#fff",
          padding: 24,
          flexDirection:
            "column",
          boxSizing:
            "border-box",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 24,
            fontSize: 28,
          }}
        >
          SilverCare 2.0
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
            flexDirection:
              "column",
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
                type="button"
                onClick={() =>
                  onMenuChange(
                    menu.key
                  )
                }
                style={{
                  display: "flex",
                  alignItems:
                    "center",
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
                  fontWeight:
                    active
                      ? 700
                      : 500,
                  transition:
                    "all .2s",
                  textAlign:
                    "left",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    width: 24,
                    minWidth: 24,
                    textAlign:
                      "center",
                    fontSize: 20,
                    lineHeight: 1,
                    fontFamily:
                      "Arial, sans-serif",
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

        <button
          type="button"
          onClick={
            handleLogout
          }
          disabled={loggingOut}
          className="silvercare-desktop-logout"
        >
          {loggingOut
            ? "登出中..."
            : "↪ 登出"}
        </button>
      </aside>

      <div
        className="silvercare-mobile-navigation"
        role="navigation"
        aria-label="手機功能選單"
      >
        {mobileMenus.map(
          (menu) => {
            const active =
              selectedMenu ===
              menu.key;

            return (
              <button
                key={menu.key}
                type="button"
                className={
                  active
                    ? "active"
                    : ""
                }
                aria-label={
                  menu.label
                }
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                onClick={() =>
                  onMenuChange(
                    menu.key
                  )
                }
              >
                <span className="silvercare-mobile-navigation-icon">
                  {menu.icon}
                </span>

                <span className="silvercare-mobile-navigation-label">
                  {menu.label}
                </span>
              </button>
            );
          }
        )}
      </div>

      <button
        type="button"
        onClick={
          handleLogout
        }
        disabled={loggingOut}
        className="silvercare-mobile-logout"
        aria-label="登出"
      >
        {loggingOut
          ? "..."
          : "↪ 登出"}
      </button>
    </>
  );
}