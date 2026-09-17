"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

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
import SupervisorOverview from "../components/SupervisorOverview";

import { supabase } from "../utils/supabase";

import { useDashboardData } from "../utils/useDashboardData";
import {
  addStorageChangedListener,
} from "../utils/storageEvents";

const ELDER_STORAGE_KEY =
  "silvercare-elders";

export default function Home() {
  const router = useRouter();

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

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [userRole, setUserRole] =
    useState<string | null>(null);

  /* ============================
   * AI 智慧查詢
   * ============================ */
  const [aiQuery, setAiQuery] =
    useState("");

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiResult, setAiResult] =
    useState("");

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
   * 取得目前登入使用者角色
   *
   * Supervisor 進入首頁時顯示據點總覽。
   * Site 使用者維持原本首頁。
   */
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setUserRole(null);
          return;
        }

        const {
          data: roleData,
          error: roleError,
        } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (roleError) {
          console.error(
            "取得使用者角色失敗：",
            roleError
          );
          setUserRole(null);
          return;
        }

        console.log(
          "目前登入角色：",
          roleData
        );

        setUserRole(
          roleData?.role ?? null
        );
      } catch (error) {
        console.error(
          "讀取使用者角色發生錯誤：",
          error
        );
        setUserRole(null);
      }
    };

    void loadUserRole();
  }, []);

  /**
   * 登出
   */
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

  /**
   * 讀取長者資料
   *
   * 長者資料統一從 Supabase 讀取，讓長者管理、簽到
   * 與健康量測使用同一份最新資料。
   *
   * Site：只讀自己的 location_id。
   * Supervisor：有選擇據點時讀該據點；沒有選擇時讀全部據點。
   */
  useEffect(() => {
    let cancelled = false;

    const getSelectedLocationId = () => {
      const keys = [
        "silvercare-selected-location-id",
        "silvercare-selected-location",
        "selectedLocationId",
        "selected-location-id",
      ];

      for (const key of keys) {
        const value = window.localStorage.getItem(key);

        if (value === null || value === "") {
          continue;
        }

        const parsed = Number(value);

        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }

      return null;
    };

    const loadElders = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!cancelled) {
            setElders([]);
          }

          console.error(
            "取得目前登入使用者失敗：",
            userError
          );

          return;
        }

        const {
          data: roleData,
          error: roleError,
        } = await supabase
          .from("user_roles")
          .select("role, location_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (roleError) {
          if (!cancelled) {
            setElders([]);
          }

          console.error(
            "取得使用者角色失敗：",
            roleError
          );

          return;
        }

        const role = roleData?.role ?? "";
        const roleLocationId =
          roleData?.location_id != null
            ? Number(roleData.location_id)
            : null;

        const selectedLocationId =
          role === "supervisor"
            ? getSelectedLocationId()
            : null;

        let query = supabase
          .from("elders")
          .select(
            `
              id,
              name,
              gender,
              birthday,
              phone,
              elder_type,
              living_status,
              contact_method,
              emergency_contact_name,
              emergency_contact_relation,
              emergency_contact_phone
            `
          )
          .order("id", { ascending: true });

        if (role === "site") {
          if (!roleLocationId) {
            if (!cancelled) {
              setElders([]);
            }

            console.warn(
              "Site 使用者沒有有效的 location_id，暫不載入長者資料。"
            );

            return;
          }

          query = query.eq(
            "location_id",
            roleLocationId
          );
        } else if (role === "supervisor") {
          if (selectedLocationId) {
            query = query.eq(
              "location_id",
              selectedLocationId
            );
          }
          // Supervisor 沒有選擇據點時，不加 location_id 條件，
          // 讓 Supervisor 可以看到全部據點的長者資料。
        } else {
          if (!roleLocationId) {
            if (!cancelled) {
              setElders([]);
            }

            console.warn(
              "目前使用者沒有有效的 location_id，暫不載入長者資料。"
            );

            return;
          }

          query = query.eq(
            "location_id",
            roleLocationId
          );
        }

        const {
          data,
          error,
        } = await query;

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setElders(
            Array.isArray(data)
              ? (data as Elder[])
              : []
          );
        }
      } catch (error) {
        console.error(
          "讀取長者資料失敗：",
          error
        );

        if (!cancelled) {
          setElders([]);
        }
      }
    };

    void loadElders();

    const handleStorageChange = () => {
      void loadElders();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    const removeStorageChangedListener =
      addStorageChangedListener(
        handleStorageChange
      );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "storage",
        handleStorageChange
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

  /**
   * AI 智慧查詢
   *
   * 第一階段：
   * 直接查詢 Supabase 的長者與課程資料。
   */
  const handleAiQuery = async (
    inputQuery?: string
  ) => {
    const query = (
      inputQuery ?? aiQuery
    ).trim();

    if (!query) {
      alert(
        "請先輸入想查詢的內容。"
      );
      return;
    }

    setAiLoading(true);
    setAiResult("");

    try {
      /*
       * ========================================
       * ① 查詢長者
       * ========================================
       */
      if (
        query.includes("長者") ||
        query.includes("老人") ||
        query.includes("人數")
      ) {
        const {
          data,
          error,
        } = await supabase
          .from("elders")
          .select(
            `
              id,
              name,
              gender,
              birthday,
              phone,
              elder_type,
              living_status,
              contact_method,
              emergency_contact_name,
              emergency_contact_relation,
              emergency_contact_phone
            `
          )
          .order("id", {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        const elders = data ?? [];

        /*
         * 查詢長者人數
         */
        if (
          query.includes("幾位") ||
          query.includes("多少") ||
          query.includes("人數")
        ) {
          setAiResult(
            `👴 目前共有 ${elders.length} 位長者。`
          );

          return;
        }

        /*
         * 查詢長者名單
         */
        if (
          query.includes("哪些") ||
          query.includes("名單") ||
          query.includes("有誰")
        ) {
          if (elders.length === 0) {
            setAiResult(
              "目前沒有長者資料。"
            );

            return;
          }

          const elderList =
            elders
              .map(
                (
                  elder,
                  index
                ) =>
                  `${index + 1}. ${elder.name}`
              )
              .join("\n");

          setAiResult(
            `👴 目前共有 ${elders.length} 位長者：\n\n${elderList}`
          );

          return;
        }
      }

      /*
       * ========================================
       * ② 查詢課程
       *
       * 支援：
       * 今天有哪些課程？
       * 9月有哪些課程？
       * 2026年9月有哪些課程？
       * ========================================
       */
      if (
        query.includes("課程") ||
        query.includes("上課")
      ) {
        const monthMatch =
          query.match(
            /(\d{1,2})月/
          );

        const yearMatch =
          query.match(
            /(\d{4})年/
          );

        const now =
          new Date();

        const currentYear =
          now.getFullYear();

        const targetYear =
          yearMatch
            ? Number(
                yearMatch[1]
              )
            : currentYear;

        /*
         * ----------------------------------------
         * ②-1 指定月份
         * ----------------------------------------
         */
        if (monthMatch) {
          const targetMonth =
            Number(
              monthMatch[1]
            );

          if (
            targetMonth < 1 ||
            targetMonth > 12
          ) {
            setAiResult(
              "月份格式不正確，請輸入 1～12 月。"
            );

            return;
          }

          const monthString =
            String(
              targetMonth
            ).padStart(
              2,
              "0"
            );

          const monthStart =
            `${targetYear}-${monthString}-01`;

          const nextMonthDate =
            new Date(
              targetYear,
              targetMonth,
              1
            );

          const nextYear =
            nextMonthDate.getFullYear();

          const nextMonth =
            String(
              nextMonthDate.getMonth() + 1
            ).padStart(
              2,
              "0"
            );

          const nextMonthStart =
            `${nextYear}-${nextMonth}-01`;

          const {
            data,
            error,
          } = await supabase
            .from("courses")
            .select(
              `
                id,
                date,
                title,
                teacher,
                start_time,
                end_time,
                capacity,
                classroom,
                note
              `
            )
            .gte(
              "date",
              monthStart
            )
            .lt(
              "date",
              nextMonthStart
            )
            .order(
              "date",
              {
                ascending: true,
              }
            )
            .order(
              "start_time",
              {
                ascending: true,
              }
            );

          if (error) {
            throw error;
          }

          const courses =
            data ?? [];

          if (
            courses.length === 0
          ) {
            setAiResult(
              `📚 ${targetYear} 年 ${targetMonth} 月目前沒有課程。`
            );

            return;
          }

          const courseList =
            courses
              .map(
                (
                  course,
                  index
                ) => {
                  const time =
                    course.start_time &&
                    course.end_time
                      ? `${course.start_time}–${course.end_time}`
                      : course.start_time ||
                        "時間未設定";

                  const teacher =
                    course.teacher
                      ? `\n   教師：${course.teacher}`
                      : "";

                  const classroom =
                    course.classroom
                      ? `\n   教室：${course.classroom}`
                      : "";

                  return (
                    `${index + 1}. ${course.title}` +
                    `\n   日期：${course.date}` +
                    `\n   時間：${time}` +
                    teacher +
                    classroom
                  );
                }
              )
              .join("\n\n");

          setAiResult(
            `📚 ${targetYear} 年 ${targetMonth} 月共有 ${courses.length} 堂課程：\n\n${courseList}`
          );

          return;
        }

        /*
         * ----------------------------------------
         * ②-2 查詢今天課程
         * ----------------------------------------
         */
        if (
          query.includes("今天") ||
          query.includes("今日")
        ) {
          const today =
            new Date();

          const year =
            today.getFullYear();

          const month =
            String(
              today.getMonth() + 1
            ).padStart(
              2,
              "0"
            );

          const day =
            String(
              today.getDate()
            ).padStart(
              2,
              "0"
            );

          const todayString =
            `${year}-${month}-${day}`;

          const {
            data,
            error,
          } = await supabase
            .from("courses")
            .select(
              `
                id,
                date,
                title,
                teacher,
                start_time,
                end_time,
                capacity,
                classroom,
                note
              `
            )
            .eq(
              "date",
              todayString
            )
            .order(
              "start_time",
              {
                ascending: true,
              }
            );

          if (error) {
            throw error;
          }

          const courses =
            data ?? [];

          if (
            courses.length === 0
          ) {
            setAiResult(
              "📚 今天目前沒有課程。"
            );

            return;
          }

          const courseList =
            courses
              .map(
                (
                  course,
                  index
                ) => {
                  const time =
                    course.start_time &&
                    course.end_time
                      ? `${course.start_time}–${course.end_time}`
                      : course.start_time ||
                        "時間未設定";

                  const teacher =
                    course.teacher
                      ? `\n   教師：${course.teacher}`
                      : "";

                  const classroom =
                    course.classroom
                      ? `\n   教室：${course.classroom}`
                      : "";

                  return (
                    `${index + 1}. ${course.title}` +
                    `\n   時間：${time}` +
                    teacher +
                    classroom
                  );
                }
              )
              .join("\n\n");

          setAiResult(
            `📚 今天共有 ${courses.length} 堂課程：\n\n${courseList}`
          );

          return;
        }
      }

      /*
       * ========================================
       * ③ 尚未支援的問題
       * ========================================
       */
      setAiResult(
        `已收到您的查詢：「${query}」\n\n` +
          "目前 AI 第一階段已經可以查詢：\n" +
          "• 長者人數\n" +
          "• 長者名單\n" +
          "• 今天的課程\n" +
          "• 指定月份的課程\n\n" +
          "下一階段再接上出席、健康量測、活動與財務資料。"
      );
    } catch (error) {
      console.error(
        "AI 查詢發生錯誤：",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setAiResult(
        "AI 查詢目前無法完成。\n\n" +
          message
      );
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * AI 快速查詢
   */
  const handleAiQuickQuery = (
    query: string
  ) => {
    setAiQuery(query);

    /*
     * 直接把 query 傳給查詢函式，
     * 避免 React setState 尚未完成，
     * 導致查到上一個問題。
     */
    void handleAiQuery(query);
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
            minHeight: 72,
            background:
              colors.primary,
            color: "#fff",
            padding:
              "14px 16px",
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
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            SilverCare
          </div>

          <button
            type="button"
            className="silvercare-mobile-header-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="登出"
            style={{
              appearance: "none",
              WebkitAppearance:
                "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent:
                "center",
              gap: 6,
              minWidth: 72,
              height: 38,
              padding:
                "0 11px",
              border:
                "1px solid rgba(255,255,255,.45)",
              borderRadius: 9,
              background:
                "rgba(255,255,255,.10)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: loggingOut
                ? "default"
                : "pointer",
              opacity: loggingOut
                ? 0.7
                : 1,
              boxSizing:
                "border-box",
              WebkitTapHighlightColor:
                "transparent",
            }}
          >
            <svg
              width="16"
              height="16"
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

            <span>
              {loggingOut
                ? "登出中"
                : "登出"}
            </span>
          </button>
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
          onLogout={handleLogout}
          loggingOut={loggingOut}
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
            SilverCare 2.0 智慧據點管理平台
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
            userRole === "supervisor" ? (
              <SupervisorOverview />
            ) : (
              <>
                {/* ==================== */}
                {/* AI 智慧查詢 */}
                {/* ==================== */}

                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #F4FAF8 0%, #FFFFFF 100%)",
                    borderRadius: 18,
                    padding: isMobile
                      ? 20
                      : 28,
                    marginBottom: 28,
                    border:
                      "1px solid #D6E8E2",
                    boxShadow:
                      "0 2px 12px rgba(22,58,67,0.06)",
                    boxSizing:
                      "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "flex-start",
                      gap: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        background:
                          colors.primary,
                        color: "#fff",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      🤖
                    </div>

                    <div>
                      <h2
                        style={{
                          margin: 0,
                          color:
                            colors.primary,
                          fontSize:
                            isMobile
                              ? 21
                              : 24,
                        }}
                      >
                        SilverCare AI 智慧查詢
                      </h2>

                      <p
                        style={{
                          margin:
                            "6px 0 0",
                          color:
                            "#6B7280",
                          fontSize: 14,
                          lineHeight:
                            1.6,
                        }}
                      >
                        想查什麼？直接用中文問我
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection:
                        isMobile
                          ? "column"
                          : "row",
                      gap: 10,
                    }}
                  >
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) =>
                        setAiQuery(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                          "Enter"
                        ) {
                          void handleAiQuery();
                        }
                      }}
                      placeholder="例如：今天哪些長者還沒有量血壓？"
                      disabled={
                        aiLoading
                      }
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 46,
                        padding:
                          "0 14px",
                        border:
                          "1px solid #D1D5DB",
                        borderRadius: 10,
                        outline: "none",
                        fontSize: 15,
                        boxSizing:
                          "border-box",
                        background:
                          "#fff",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void handleAiQuery()
                      }
                      disabled={
                        aiLoading
                      }
                      style={{
                        minWidth: isMobile
                          ? "100%"
                          : 100,
                        height: 46,
                        border: "none",
                        borderRadius: 10,
                        background:
                          colors.primary,
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor:
                          aiLoading
                            ? "default"
                            : "pointer",
                        opacity:
                          aiLoading
                            ? 0.7
                            : 1,
                      }}
                    >
                      {aiLoading
                        ? "查詢中..."
                        : "開始查詢"}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap:
                        "wrap",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleAiQuickQuery(
                          "目前有幾位長者？"
                        )
                      }
                      style={{
                        border:
                          "1px solid #D6E8E2",
                        background:
                          "#FFFFFF",
                        color:
                          colors.primary,
                        borderRadius: 999,
                        padding:
                          "7px 12px",
                        fontSize: 13,
                        cursor:
                          "pointer",
                      }}
                    >
                      長者人數
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAiQuickQuery(
                          "今天有哪些課程？"
                        )
                      }
                      style={{
                        border:
                          "1px solid #D6E8E2",
                        background:
                          "#FFFFFF",
                        color:
                          colors.primary,
                        borderRadius: 999,
                        padding:
                          "7px 12px",
                        fontSize: 13,
                        cursor:
                          "pointer",
                      }}
                    >
                      今日課程
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAiQuickQuery(
                          `${new Date().getMonth() + 1}月有哪些課程？`
                        )
                      }
                      style={{
                        border:
                          "1px solid #D6E8E2",
                        background:
                          "#FFFFFF",
                        color:
                          colors.primary,
                        borderRadius: 999,
                        padding:
                          "7px 12px",
                        fontSize: 13,
                        cursor:
                          "pointer",
                      }}
                    >
                      本月課程
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAiQuickQuery(
                          "有哪些長者？"
                        )
                      }
                      style={{
                        border:
                          "1px solid #D6E8E2",
                        background:
                          "#FFFFFF",
                        color:
                          colors.primary,
                        borderRadius: 999,
                        padding:
                          "7px 12px",
                        fontSize: 13,
                        cursor:
                          "pointer",
                      }}
                    >
                      長者名單
                    </button>
                  </div>

                  {aiResult && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: 16,
                        background:
                          "#FFFFFF",
                        border:
                          "1px solid #D6E8E2",
                        borderRadius: 12,
                        whiteSpace:
                          "pre-wrap",
                        color:
                          "#374151",
                        fontSize: 14,
                        lineHeight:
                          1.7,
                      }}
                    >
                      {aiResult}
                    </div>
                  )}
                </div>

                {/* ==================== */}
                {/* Dashboard Cards */}
                {/* ==================== */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      isMobile
                        ? "1fr"
                        : "repeat(4, minmax(0, 1fr))",
                    gap: 18,
                    marginBottom: 28,
                  }}
                >
                  <div
                    style={{
                      background:
                        "#fff",
                      borderRadius: 16,
                      padding: 22,
                      boxShadow:
                        "0 2px 10px rgba(0,0,0,0.05)",
                      border:
                        "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color:
                          "#6B7280",
                        marginBottom: 8,
                      }}
                    >
                      長者總數
                    </div>

                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color:
                          colors.primary,
                      }}
                    >
                      {
                        dashboardData.elderCount
                      }
                    </div>
                  </div>

                  <div
                    style={{
                      background:
                        "#fff",
                      borderRadius: 16,
                      padding: 22,
                      boxShadow:
                        "0 2px 10px rgba(0,0,0,0.05)",
                      border:
                        "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color:
                          "#6B7280",
                        marginBottom: 8,
                      }}
                    >
                      今日課程
                    </div>

                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color:
                          colors.primary,
                      }}
                    >
                      {
                        dashboardData.todayCourseCount
                      }
                    </div>
                  </div>

                  <div
                    style={{
                      background:
                        "#fff",
                      borderRadius: 16,
                      padding: 22,
                      boxShadow:
                        "0 2px 10px rgba(0,0,0,0.05)",
                      border:
                        "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color:
                          "#6B7280",
                        marginBottom: 8,
                      }}
                    >
                      今日健康量測
                    </div>

                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color:
                          colors.primary,
                      }}
                    >
                      {
                        dashboardData.todayHealthCount
                      }
                    </div>
                  </div>

                  <div
                    style={{
                      background:
                        "#fff",
                      borderRadius: 16,
                      padding: 22,
                      boxShadow:
                        "0 2px 10px rgba(0,0,0,0.05)",
                      border:
                        "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color:
                          "#6B7280",
                        marginBottom: 8,
                      }}
                    >
                      今日簽到
                    </div>

                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color:
                          colors.primary,
                      }}
                    >
                      {
                        dashboardData.todayAttendanceCount
                      }
                    </div>
                  </div>
                </div>

                {/* ==================== */}
                {/* Dashboard Activities */}
                {/* ==================== */}

                <DashboardActivities />
              </>
            )
          )}

          {/* ==================== */}
          {/* Elder */}
          {/* ==================== */}

          {selectedMenu ===
            "elder" && (
            <div
              style={{
                display: "flex",
                flexDirection:
                  isMobile
                    ? "column"
                    : "row",
                gap: 20,
                alignItems:
                  "flex-start",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <ElderList
                  onSelectElder={
                    setSelectedElder
                  }
                />
              </div>

              {selectedElder && (
                <div
                  style={{
                    width: isMobile
                      ? "100%"
                      : 380,
                    flexShrink: 0,
                  }}
                >
                  <ElderProfile
                    elder={
                      selectedElder
                    }
                  />
                </div>
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
                        color:
                          "#374151",
                        borderRadius: 10,
                        height: 42,
                        padding:
                          "0 16px",
                        cursor:
                          "pointer",
                      }}
                    >
                      返回
                    </button>
                  </div>

                  {/* ==================== */}
                  {/* 真正的健康量測功能 */}
                  {/* ==================== */}

                  <ElderProfile
                    elder={
                      healthElder
                    }
                  />
                </>
              ) : (
                <div
                  style={{
                    background:
                      "#fff",
                    borderRadius: 16,
                    padding: 28,
                    boxShadow:
                      "0 2px 10px rgba(0,0,0,0.06)",
                  }}
                >
                  <h2
                    style={{
                      margin:
                        "0 0 10px",
                      color:
                        colors.primary,
                      fontSize: 24,
                    }}
                  >
                    健康量測
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color:
                        "#6B7280",
                    }}
                  >
                    請先從長者簽到後進入健康量測。
                  </p>
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
                borderRadius: 16,
                padding: isMobile
                  ? 20
                  : 28,
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 12px",
                  color:
                    colors.primary,
                  fontSize: 24,
                }}
              >
                系統設定
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    "#6B7280",
                  lineHeight:
                    1.7,
                }}
              >
                SilverCare 系統設定功能。
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}