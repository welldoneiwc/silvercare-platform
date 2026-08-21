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
  label: string;
}[] = [
  {
    key: "dashboard",
    label: "首頁",
  },
  {
    key: "elder",
    label: "長者管理",
  },
  {
    key: "attendance",
    label: "長者簽到",
  },
  {
    key: "health",
    label: "健康量測",
  },
  {
    key: "course",
    label: "課程管理",
  },
  {
    key: "activity",
    label: "活動管理",
  },
  {
    key: "finance",
    label: "財務管理",
  },
  {
    key: "setting",
    label: "系統設定",
  },
];

const mobileMenus: {
  key: MenuType;
  label: string;
}[] = [
  {
    key: "dashboard",
    label: "首頁",
  },
  {
    key: "attendance",
    label: "簽到",
  },
  {
    key: "elder",
    label: "長者",
  },
  {
    key: "course",
    label: "課程",
  },
  {
    key: "activity",
    label: "活動",
  },
  {
    key: "finance",
    label: "財務",
  },
  {
    key: "health",
    label: "健康",
  },
];

function MenuIcon({
  menu,
  size = 22,
}: {
  menu: MenuType;
  size?: number;
}) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (menu) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10.5V20h13v-9.5" />
          <path d="M9.5 20v-5h5v5" />
        </svg>
      );

    case "elder":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="7" r="3" />
          <path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6" />
          <path d="M4 19c.4-2 1.3-3.4 2.7-4.3" />
          <path d="M20 19c-.4-2-1.3-3.4-2.7-4.3" />
        </svg>
      );

    case "attendance":
      return (
        <svg {...commonProps}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "health":
      return (
        <svg {...commonProps}>
          <path d="M20.8 8.8c0 5.3-8.8 10.2-8.8 10.2S3.2 14.1 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z" />
        </svg>
      );

    case "course":
      return (
        <svg {...commonProps}>
          <rect
            x="4"
            y="3"
            width="16"
            height="18"
            rx="2"
          />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );

    case "activity":
      return (
        <svg {...commonProps}>
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="2"
          />
          <path d="M8 8h.01" />
          <path d="M12 8h.01" />
          <path d="M16 8h.01" />
          <path d="M8 12h.01" />
          <path d="M12 12h.01" />
          <path d="M16 12h.01" />
          <path d="M8 16h.01" />
          <path d="M12 16h.01" />
          <path d="M16 16h.01" />
        </svg>
      );

    case "finance":
      return (
        <svg {...commonProps}>
          <path d="M12 2v20" />
          <path d="M17 6.5c-.8-1.1-2.2-1.8-4-1.8-2.2 0-4 1.1-4 3 0 4.5 8 2.2 8 6.4 0 1.9-1.7 3.2-4.2 3.2-1.9 0-3.5-.7-4.4-2" />
        </svg>
      );

    case "setting":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );

    default:
      return null;
  }
}

function LogoutIcon({
  size = 18,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M12 21h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-7" />
    </svg>
  );
}

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
      const { error } =
        await supabase.auth.signOut();

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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-sizing: border-box;
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
            height: calc(82px + env(safe-area-inset-bottom)) !important;
            z-index: 2147483640 !important;
            display: grid !important;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            background: #ffffff;
            border-top: 1px solid #e5e7eb;
            box-shadow: 0 -5px 18px rgba(0, 0, 0, 0.08);
            padding:
              6px
              6px
              calc(6px + env(safe-area-inset-bottom));
            box-sizing: border-box;
            pointer-events: auto !important;
            touch-action: manipulation !important;
            isolation: isolate;
          }

          .silvercare-mobile-navigation button {
            appearance: none;
            -webkit-appearance: none;
            position: relative;
            z-index: 2147483641;
            min-width: 0;
            width: 100%;
            height: 68px;
            border: none;
            outline: none;
            background: transparent;
            color: #9ca3af;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            padding: 5px 2px;
            margin: 0;
            border-radius: 10px;
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
            background: #E8F2F0 !important;
            transform: scale(0.96);
          }

          .silvercare-mobile-navigation button.active {
            color: ${colors.primary};
            font-weight: 700;
          }

          .silvercare-mobile-navigation-icon {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            pointer-events: none;
          }

          .silvercare-mobile-navigation-label {
            font-size: 11px;
            line-height: 1.2;
            white-space: nowrap;
            pointer-events: none;
          }

          .silvercare-mobile-logout {
            position: fixed !important;
            top: 30px !important;
            right: 14px !important;
            z-index: 2147483646 !important;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-width: 84px;
            height: 40px;
            padding: 0 12px;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            background: #ffffff;
            box-shadow: 0 3px 12px rgba(0,0,0,.12);
            color: #374151;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
          }

          .silvercare-mobile-logout:active {
            transform: scale(0.96);
          }

          .silvercare-mobile-logout:disabled {
            opacity: 0.7;
            cursor: default;
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
          flexDirection: "column",
          boxSizing: "border-box",
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
            flexDirection: "column",
            gap: 8,
          }}
        >
          {menus.map((menu) => {
            const active =
              selectedMenu === menu.key;

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
                  fontWeight:
                    active ? 700 : 500,
                  transition:
                    "all .2s",
                  textAlign: "left",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    width: 24,
                    minWidth: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MenuIcon
                    menu={menu.key}
                    size={21}
                  />
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
          onClick={handleLogout}
          disabled={loggingOut}
          className="silvercare-desktop-logout"
          aria-label="登出"
        >
          <LogoutIcon size={17} />

          <span>
            {loggingOut
              ? "登出中..."
              : "登出"}
          </span>
        </button>
      </aside>

      <nav
        className="silvercare-mobile-navigation"
        role="navigation"
        aria-label="手機功能選單"
      >
        {mobileMenus.map(
          (menu) => {
            const active =
              selectedMenu === menu.key;

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
                  <MenuIcon
                    menu={menu.key}
                    size={25}
                  />
                </span>

                <span className="silvercare-mobile-navigation-label">
                  {menu.label}
                </span>
              </button>
            );
          }
        )}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="silvercare-mobile-logout"
        aria-label="登出"
      >
        <LogoutIcon size={17} />

        <span>
          {loggingOut
            ? "登出中"
            : "登出"}
        </span>
      </button>
    </>
  );
}