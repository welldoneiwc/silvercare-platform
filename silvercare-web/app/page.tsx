"use client";

import {
  useEffect,
  useState,
} from "react";

import { colors } from "../styles/theme";

import Sidebar, {
  MenuType,
} from "../components/Sidebar";

import ElderList from "../components/ElderList";
import type { Elder } from "../components/ElderList";

import ElderProfile from "../components/ElderProfile";
import CourseSection from "../components/CourseSection";
import ActivitySection from "../components/ActivitySection";
import DashboardActivities from "../components/DashboardActivities";
import AttendanceSection from "../components/AttendanceSection";
import FinanceSection from "../components/FinanceSection";

import { useDashboardData } from "../utils/useDashboardData";
import {
  addStorageChangedListener,
} from "../utils/storageEvents";

const ELDER_STORAGE_KEY =
  "silvercare-elders";

export default function Home() {
  const [selectedMenu, setSelectedMenu] =
    useState<MenuType>("dashboard");

  const [selectedElder, setSelectedElder] =
    useState<Elder | null>(null);

  const [healthElder, setHealthElder] =
    useState<Elder | null>(null);

  const [elders, setElders] =
    useState<Elder[]>([]);

  const [isMobile, setIsMobile] =
    useState(false);

  const dashboardData =
    useDashboardData();

  /**
   * 判斷目前裝置寬度
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768
      );
    };

    checkMobile();

    window.addEventListener(
      "resize",
      checkMobile
    );

    return () => {
      window.removeEventListener(
        "resize",
        checkMobile
      );
    };
  }, []);

  /**
   * 讀取長者資料
   *
   * 簽到需要使用與長者管理
   * 相同的 LocalStorage 資料。
   */
  useEffect(() => {
    const loadElders = () => {
      try {
        const saved =
          localStorage.getItem(
            ELDER_STORAGE_KEY
          );

        if (!saved) {
          setElders([]);
          return;
        }

        const parsed =
          JSON.parse(saved) as Elder[];

        setElders(
          Array.isArray(parsed)
            ? parsed
            : []
        );
      } catch (error) {
        console.error(
          "讀取長者資料失敗：",
          error
        );

        setElders([]);
      }
    };

    loadElders();

    window.addEventListener(
      "storage",
      loadElders
    );

    const removeStorageChangedListener =
      addStorageChangedListener(
        loadElders
      );

    return () => {
      window.removeEventListener(
        "storage",
        loadElders
      );

      removeStorageChangedListener();
    };
  }, []);

  /**
   * 簽到成功後：
   *
   * 1. 記住這位長者
   * 2. 自動切換到健康量測
   */
  const handleAttendanceSuccess = (
    elder: Elder
  ) => {
    setHealthElder(elder);
    setSelectedMenu("health");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile
          ? "column"
          : "row",
        width: "100%",
        minHeight: "100vh",
        background:
          colors.background,
      }}
    >
      {/* ==================== */}
      {/* Mobile Header */}
      {/* ==================== */}

      {isMobile && (
        <div
          style={{
            width: "100%",
            minHeight: 88,
            background:
              colors.primary,
            color: "#fff",
            padding:
              "18px 20px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.12)",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            SilverCare
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <button
              type="button"
              aria-label="通知"
              style={{
                border: "none",
                background:
                  "transparent",
                color: "#fff",
                fontSize: 28,
                padding: 4,
                cursor: "pointer",
              }}
            >
              ♡
            </button>

            <button
              type="button"
              aria-label="登入"
              style={{
                border:
                  "1px solid rgba(255,255,255,0.45)",
                background:
                  "transparent",
                color: "#fff",
                borderRadius: 10,
                fontSize: 24,
                width: 44,
                height: 44,
                cursor: "pointer",
              }}
            >
              ↪
            </button>
          </div>
        </div>
      )}

      {/* ==================== */}
      {/* Main Layout */}
      {/* ==================== */}

      <div
        style={{
          display: "flex",
          flexDirection: isMobile
            ? "column"
            : "row",
          width: "100%",
          flex: 1,
          minHeight: 0,
        }}
      >
        <Sidebar
          selectedMenu={
            selectedMenu
          }
          onMenuChange={(menu) => {
            setSelectedMenu(menu);

            if (menu !== "elder") {
              setSelectedElder(
                null
              );
            }

            if (menu !== "health") {
              setHealthElder(
                null
              );
            }
          }}
        />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: isMobile
              ? "28px 20px 110px"
              : 40,
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              fontSize: isMobile
                ? 32
                : 36,
              fontWeight: 700,
              color: colors.title,
              marginBottom: 8,
              lineHeight: 1.25,
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

          {/* ==================== */}
          {/* Dashboard */}
          {/* ==================== */}

          {selectedMenu ===
            "dashboard" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    isMobile
                      ? "repeat(2, minmax(0, 1fr))"
                      : "repeat(4, minmax(0, 1fr))",
                  gap: isMobile
                    ? 14
                    : 20,
                  marginBottom: 32,
                }}
              >
                <div
                  style={{
                    ...cardStyle,
                    border:
                      "1px solid #B7E3D2",
                  }}
                >
                  <div
                    style={
                      labelStyle
                    }
                  >
                    長者人數
                  </div>

                  <div
                    style={
                      valueStyle
                    }
                  >
                    {
                      dashboardData.elderCount
                    }
                  </div>
                </div>

                <div
                  style={{
                    ...cardStyle,
                    border:
                      "1px solid #C8DCF7",
                  }}
                >
                  <div
                    style={
                      labelStyle
                    }
                  >
                    今日課程
                  </div>

                  <div
                    style={
                      valueStyle
                    }
                  >
                    {
                      dashboardData.todayCourseCount
                    }
                  </div>
                </div>

                <div
                  style={{
                    ...cardStyle,
                    border:
                      "1px solid #F3D5D5",
                  }}
                >
                  <div
                    style={
                      labelStyle
                    }
                  >
                    今日量測
                  </div>

                  <div
                    style={
                      valueStyle
                    }
                  >
                    {
                      dashboardData.todayHealthCount
                    }
                  </div>
                </div>

                <div
                  style={{
                    ...cardStyle,
                    border:
                      "1px solid #F0E1A6",
                  }}
                >
                  <div
                    style={
                      labelStyle
                    }
                  >
                    今日簽到
                  </div>

                  <div
                    style={
                      valueStyle
                    }
                  >
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
                  padding: isMobile
                    ? 24
                    : 40,
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

              {/* ==================== */}
              {/* 近期活動公告 */}
              {/* ==================== */}

              <div
                style={{
                  marginTop: 24,
                }}
              >
                <DashboardActivities />
              </div>
            </>
          )}

          {/* ==================== */}
          {/* Elder */}
          {/* ==================== */}

          {selectedMenu ===
            "elder" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  selectedElder &&
                  !isMobile
                    ? "1.2fr 1fr"
                    : "1fr",
                gap: 24,
                alignItems:
                  "start",
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

          {/* ==================== */}
          {/* Attendance */}
          {/* ==================== */}

          {selectedMenu ===
            "attendance" && (
            <AttendanceSection
              elders={elders}
              onCheckInSuccess={
                handleAttendanceSuccess
              }
            />
          )}

          {/* ==================== */}
          {/* Course */}
          {/* ==================== */}

          {selectedMenu ===
            "course" && (
            <CourseSection />
          )}

          {/* ==================== */}
          {/* Health */}
          {/* ==================== */}

          {selectedMenu ===
            "health" && (
            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 20,
              }}
            >
              {healthElder ? (
                <>
                  <div
                    style={{
                      background:
                        "#fff",
                      borderRadius: 16,
                      padding: 24,
                      boxShadow:
                        "0 2px 10px rgba(0,0,0,0.06)",
                      display: "flex",
                      flexDirection:
                        isMobile
                          ? "column"
                          : "row",
                      justifyContent:
                        "space-between",
                      alignItems:
                        isMobile
                          ? "stretch"
                          : "center",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          color:
                            "#6B7280",
                          marginBottom: 6,
                        }}
                      >
                        已簽到長者
                      </div>

                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color:
                            colors.primary,
                        }}
                      >
                        {
                          healthElder.name
                        }
                      </div>

                      {healthElder.phone && (
                        <div
                          style={{
                            marginTop: 6,
                            color:
                              "#6B7280",
                            fontSize: 14,
                          }}
                        >
                          {
                            healthElder.phone
                          }
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setHealthElder(
                          null
                        )
                      }
                      style={{
                        border:
                          "1px solid #D1D5DB",
                        background:
                          "#fff",
                        borderRadius: 8,
                        padding:
                          "9px 16px",
                        cursor:
                          "pointer",
                        fontWeight: 600,
                      }}
                    >
                      重新選擇
                    </button>
                  </div>

                  <div
                    style={{
                      background:
                        "#fff",
                      borderRadius: 16,
                      padding: 24,
                      boxShadow:
                        "0 2px 10px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 20,
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          color:
                            colors.primary,
                        }}
                      >
                        開始健康量測
                      </h2>

                      <p
                        style={{
                          margin:
                            "8px 0 0",
                          color:
                            "#6B7280",
                          fontSize: 14,
                        }}
                      >
                        已完成簽到，可以開始為
                        {
                          healthElder.name
                        }
                        進行健康量測。
                      </p>
                    </div>

                    <ElderProfile
                      elder={
                        healthElder
                      }
                    />
                  </div>
                </>
              ) : (
                <div
                  style={{
                    background:
                      "#fff",
                    padding: isMobile
                      ? 24
                      : 40,
                    borderRadius: 16,
                    textAlign:
                      "center",
                    boxShadow:
                      "0 2px 10px rgba(0,0,0,0.06)",
                  }}
                >
                  <h2
                    style={{
                      color:
                        colors.primary,
                    }}
                  >
                    ❤️ 健康量測
                  </h2>

                  <p
                    style={{
                      color:
                        "#6B7280",
                      marginBottom: 24,
                    }}
                  >
                    請先到「今日簽到」搜尋長者並完成簽到。
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMenu(
                        "attendance"
                      )
                    }
                    style={{
                      background:
                        colors.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding:
                        "11px 20px",
                      cursor:
                        "pointer",
                      fontWeight: 600,
                    }}
                  >
                    前往今日簽到
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== */}
          {/* Activity */}
          {/* ==================== */}

          {selectedMenu ===
            "activity" && (
            <ActivitySection />
          )}

          {/* ==================== */}
          {/* Finance */}
          {/* ==================== */}

          {selectedMenu ===
            "finance" && (
            <FinanceSection />
          )}

          {/* ==================== */}
          {/* Setting */}
          {/* ==================== */}

          {selectedMenu ===
            "setting" && (
            <div
              style={{
                background:
                  "#fff",
                padding: isMobile
                  ? 24
                  : 40,
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
    </div>
  );
}

const cardStyle:
  React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.06)",
  boxSizing: "border-box",
};

const labelStyle:
  React.CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
};

const valueStyle:
  React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  marginTop: 8,
};