"use client";

import { colors } from "../styles/theme";

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
  { key: "dashboard", icon: "⌂", label: "首頁" },
  { key: "elder", icon: "♙", label: "長者管理" },
  { key: "attendance", icon: "✓", label: "長者簽到" },
  { key: "health", icon: "♡", label: "健康量測" },
  { key: "course", icon: "▤", label: "課程管理" },
  { key: "activity", icon: "▦", label: "活動管理" },
  { key: "finance", icon: "$", label: "財務管理" },
  { key: "setting", icon: "⚙", label: "系統設定" },
];

const mobileMenus: {
  key: MenuType;
  icon: string;
  label: string;
}[] = [
  { key: "dashboard", icon: "⌂", label: "首頁" },
  { key: "attendance", icon: "✓", label: "簽到" },
  { key: "elder", icon: "♙", label: "長者" },
  { key: "course", icon: "▤", label: "課程" },
  { key: "finance", icon: "$", label: "財務" },
  { key: "health", icon: "♡", label: "健康" },
];

export default function Sidebar({
  selectedMenu,
  onMenuChange,
}: Props) {
  return (
    <>
      <style>{`
        .silvercare-desktop-sidebar {
          display: flex;
        }

        .silvercare-mobile-navigation {
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
            grid-template-columns: repeat(6, minmax(0, 1fr));
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
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 27px;
            line-height: 1;
            font-family:
              Arial,
              "Noto Sans",
              sans-serif;
            pointer-events: none;
          }

          .silvercare-mobile-navigation-label {
            font-size: 12px;
            line-height: 1.2;
            white-space: nowrap;
            pointer-events: none;
          }

          .silvercare-mobile-navigation button.active
            .silvercare-mobile-navigation-icon {
            font-weight: 700;
          }
        }
      `}</style>

      <aside
        className="silvercare-desktop-sidebar"
        style={{
          width: 250,
          minWidth: 250,
          minHeight: "100vh",
          background: colors.primary,
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
            background: "rgba(255,255,255,.2)",
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
            const active = selectedMenu === menu.key;

            return (
              <button
                key={menu.key}
                type="button"
                onClick={() => onMenuChange(menu.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
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
                  fontWeight: active ? 700 : 500,
                  transition: "all .2s",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    width: 24,
                    minWidth: 24,
                    textAlign: "center",
                    fontSize: 20,
                    lineHeight: 1,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {menu.icon}
                </span>

                <span>{menu.label}</span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 24,
            fontSize: 12,
            color: "rgba(255,255,255,.65)",
          }}
        >
          SilverCare v0.7
        </div>
      </aside>

      <div
        className="silvercare-mobile-navigation"
        role="navigation"
        aria-label="手機功能選單"
      >
        {mobileMenus.map((menu) => {
          const active = selectedMenu === menu.key;

          return (
            <button
              key={menu.key}
              type="button"
              className={active ? "active" : ""}
              aria-label={menu.label}
              aria-current={active ? "page" : undefined}
              onClick={() => onMenuChange(menu.key)}
            >
              <span className="silvercare-mobile-navigation-icon">
                {menu.icon}
              </span>

              <span className="silvercare-mobile-navigation-label">
                {menu.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}