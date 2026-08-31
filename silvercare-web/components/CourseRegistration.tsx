"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

import { supabase } from "../utils/supabase";

type Course = {
  id?: number;
  date: string;
  title: string;
  teacher: string;
  startTime: string;
  endTime: string;
  capacity: number;
  classroom: string;
  note: string;
};

type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};

export type CourseRegistration = {
  id: number;
  courseId: number;

  elderId?: number;

  name: string;
  phone: string;

  registeredAt: string;

  status:
    | "confirmed"
    | "waitlist";

  waitlistPosition?: number | null;
};

type Props = {
  course: Course | null;
};

const COURSE_STORAGE_KEY =
  "silvercare-courses";

const ELDER_STORAGE_KEY =
  "silvercare-elders";

type SupabaseRegistration = {
  id: number;
  course_id: number;
  name: string;
  phone: string;
  registered_at: string;
  status:
    | "confirmed"
    | "waitlist";
  waitlist_position:
    | number
    | null;
};

function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return `${parts[0]}/${parts[1]}/${parts[2]}`;
}

function normalizePhone(
  phone?: string
) {
  return (phone ?? "")
    .replace(/\s/g, "")
    .replace(/-/g, "");
}

export default function CourseRegistration({
  course,
}: Props) {
  const [courses, setCourses] =
    useState<Course[]>([]);

  const [elders, setElders] =
    useState<Elder[]>([]);

  const [
    registrations,
    setRegistrations,
  ] = useState<
    CourseRegistration[]
  >([]);

  const [
    selectedElderId,
    setSelectedElderId,
  ] = useState<number | null>(
    null
  );

  const [manualName, setManualName] =
    useState("");

  const [manualPhone, setManualPhone] =
    useState("");

  const [
    registrationMode,
    setRegistrationMode,
  ] = useState<
    "system" | "manual"
  >("system");

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    cancellingId,
    setCancellingId,
  ] = useState<number | null>(
    null
  );

  /**
   * 讀取課程與長者資料
   *
   * 課程與長者目前仍沿用既有
   * LocalStorage 架構。
   */
  useEffect(() => {
    try {
      const savedCourses =
        localStorage.getItem(
          COURSE_STORAGE_KEY
        );

      if (savedCourses) {
        const parsedCourses =
          JSON.parse(
            savedCourses
          );

        if (
          Array.isArray(
            parsedCourses
          )
        ) {
          setCourses(
            parsedCourses
          );
        }
      }

      const savedElders =
        localStorage.getItem(
          ELDER_STORAGE_KEY
        );

      if (savedElders) {
        const parsedElders =
          JSON.parse(
            savedElders
          );

        if (
          Array.isArray(
            parsedElders
          )
        ) {
          setElders(
            parsedElders
          );
        }
      }
    } catch (error) {
      console.error(
        "讀取課程管理資料失敗：",
        error
      );
    }
  }, []);

  /**
   * 目前指定課程
   */
  const selectedCourse =
    useMemo(() => {
      if (!course?.id) {
        return null;
      }

      return (
        courses.find(
          (item) =>
            item.id === course.id
        ) || course
      );
    }, [course, courses]);

  /**
   * 從 Supabase 讀取目前課程的報名資料
   */
  useEffect(() => {
    if (!selectedCourse?.id) {
      setRegistrations([]);
      return;
    }

    let cancelled = false;

    async function loadRegistrations() {
      setLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "course_registrations"
          )
          .select(
            "id, course_id, name, phone, registered_at, status, waitlist_position"
          )
          .eq(
            "course_id",
            selectedCourse?.id
          )
          .order(
            "status",
            {
              ascending: true,
            }
          )
          .order(
            "waitlist_position",
            {
              ascending: true,
              nullsFirst: true,
            }
          )
          .order(
            "registered_at",
            {
              ascending: true,
            }
          );
          

        if (error) {
          console.error(
            "讀取課程報名資料失敗：",
            error
          );

          if (!cancelled) {
            setRegistrations([]);
          }

          return;
        }

        const mapped =
          (
            data as SupabaseRegistration[]
          ).map(
            (
              item
            ): CourseRegistration => {
              const matchedElder =
                elders.find(
                  (elder) =>
                    normalizePhone(
                      elder.phone
                    ) ===
                    normalizePhone(
                      item.phone
                    )
                );

              return {
                id: item.id,

                courseId:
                  item.course_id,

                elderId:
                  matchedElder?.id,

                name:
                  item.name,

                phone:
                  item.phone,

                registeredAt:
                  item.registered_at,

                status:
                  item.status,

                waitlistPosition:
                  item.waitlist_position,
              };
            }
          );

        if (!cancelled) {
          setRegistrations(
            mapped
          );
        }
      } catch (error) {
        console.error(
          "讀取課程報名資料發生錯誤：",
          error
        );

        if (!cancelled) {
          setRegistrations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRegistrations();

    return () => {
      cancelled = true;
    };
  }, [
    selectedCourse?.id,
    elders,
  ]);

  /**
   * 目前課程的報名資料
   */
  const courseRegistrations =
    useMemo(() => {
      if (
        !selectedCourse?.id
      ) {
        return [];
      }

      return registrations.filter(
        (registration) =>
          registration.courseId ===
          selectedCourse.id
      );
    }, [
      registrations,
      selectedCourse,
    ]);

  /**
   * 正取名單
   */
  const confirmedRegistrations =
    useMemo(() => {
      return courseRegistrations.filter(
        (registration) =>
          registration.status ===
          "confirmed"
      );
    }, [courseRegistrations]);

  /**
   * 候補名單
   */
  const waitlistRegistrations =
    useMemo(() => {
      return courseRegistrations
        .filter(
          (registration) =>
            registration.status ===
            "waitlist"
        )
        .sort(
          (a, b) =>
            (a.waitlistPosition ??
              999999) -
            (b.waitlistPosition ??
              999999)
        );
    }, [courseRegistrations]);

  /**
   * 已經報名的系統長者 ID
   */
  const registeredElderIds =
    useMemo(() => {
      return new Set(
        courseRegistrations
          .filter(
            (registration) =>
              registration.elderId !==
              undefined
          )
          .map(
            (registration) =>
              registration.elderId
          )
      );
    }, [courseRegistrations]);

  /**
   * 還沒有報名這門課的系統長者
   */
  const availableElders =
    useMemo(() => {
      return elders.filter(
        (elder) =>
          !registeredElderIds.has(
            elder.id
          )
      );
    }, [
      elders,
      registeredElderIds,
    ]);

  /**
   * 正取人數
   */
  const confirmedCount =
    confirmedRegistrations.length;

  /**
   * 剩餘正取名額
   */
  const remainingSeats =
    selectedCourse
      ? Math.max(
          selectedCourse.capacity -
            confirmedCount,
          0
        )
      : 0;

  /**
   * 切換報名方式
   */
  const handleModeChange = (
    mode:
      | "system"
      | "manual"
  ) => {
    setRegistrationMode(
      mode
    );

    setSelectedElderId(
      null
    );

    setManualName("");

    setManualPhone("");
  };

  /**
   * 新增報名
   *
   * 使用 Supabase RPC：
   * - 有名額 → 正取
   * - 額滿 → 候補
   */
  const handleRegister =
    async () => {
      if (!selectedCourse) {
        alert(
          "找不到目前課程"
        );
        return;
      }

      if (
        !selectedCourse.id
      ) {
        alert(
          "此課程缺少 ID，無法報名"
        );
        return;
      }

      let name = "";
      let phone = "";

      if (
        registrationMode ===
        "system"
      ) {
        if (
          selectedElderId ===
          null
        ) {
          alert(
            "請先選擇長者"
          );
          return;
        }

        const selectedElder =
          elders.find(
            (elder) =>
              elder.id ===
              selectedElderId
          );

        if (!selectedElder) {
          alert(
            "找不到這位長者資料"
          );
          return;
        }

        name =
          selectedElder.name;

        phone =
          selectedElder.phone;
      } else {
        name =
          manualName.trim();

        phone =
          manualPhone.trim();

        if (!name) {
          alert(
            "請輸入姓名"
          );
          return;
        }

        if (!phone) {
          alert(
            "請輸入電話"
          );
          return;
        }
      }

      setSaving(true);

      try {
        const {
          data,
          error,
        } = await supabase.rpc(
          "register_for_course",
          {
            p_course_id:
              selectedCourse.id,
            p_name: name,
            p_phone:
              normalizePhone(
                phone
              ),
          }
        );

        if (error) {
          console.error(
            "新增課程報名失敗：",
            error
          );

          alert(
            "新增報名失敗，請稍後再試。"
          );

          return;
        }

        const result =
          Array.isArray(data)
            ? data[0]
            : data;

        if (
          !result?.success
        ) {
          alert(
            result?.message ||
              "目前無法完成報名。"
          );

          return;
        }

        if (
          result.registration_status ===
          "waitlist"
        ) {
          alert(
            `課程已額滿，已加入候補第 ${result.waitlist_position} 位。`
          );
        } else {
          alert(
            "報名成功"
          );
        }

        if (
          registrationMode ===
          "system"
        ) {
          setSelectedElderId(
            null
          );
        } else {
          setManualName("");

          setManualPhone("");
        }

        await reloadRegistrations();
      } catch (error) {
        console.error(
          "新增課程報名發生錯誤：",
          error
        );

        alert(
          "新增報名發生錯誤，請稍後再試。"
        );
      } finally {
        setSaving(false);
      }
    };

  /**
   * 重新讀取報名資料
   */
  const reloadRegistrations =
    async () => {
      if (
        !selectedCourse?.id
      ) {
        return;
      }

      setLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "course_registrations"
          )
          .select(
            "id, course_id, name, phone, registered_at, status, waitlist_position"
          )
          .eq(
            "course_id",
            selectedCourse.id
          )
          .order(
            "registered_at",
            {
              ascending: true,
            }
          );

        if (error) {
          console.error(
            "重新讀取課程報名資料失敗：",
            error
          );

          return;
        }

        const mapped =
          (
            data as SupabaseRegistration[]
          ).map(
            (
              item
            ): CourseRegistration => {
              const matchedElder =
                elders.find(
                  (elder) =>
                    normalizePhone(
                      elder.phone
                    ) ===
                    normalizePhone(
                      item.phone
                    )
                );

              return {
                id: item.id,

                courseId:
                  item.course_id,

                elderId:
                  matchedElder?.id,

                name:
                  item.name,

                phone:
                  item.phone,

                registeredAt:
                  item.registered_at,

                status:
                  item.status,

                waitlistPosition:
                  item.waitlist_position,
              };
            }
          );
console.log(
  "🟣 報名 mapped：",
  mapped
);
        setRegistrations(
          mapped
        );
      } catch (error) {
        console.error(
          "重新讀取課程報名資料發生錯誤：",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  /**
   * 取消報名
   *
   * 使用 Supabase RPC：
   * - 正取取消 → 釋放名額
   * - 若有候補 → 第一位候補自動遞補
   * - 候補取消 → 自動重新整理候補順位
   */
  const handleCancelRegistration =
    async (
      registrationId: number
    ) => {
      const registration =
        courseRegistrations.find(
          (item) =>
            item.id ===
            registrationId
        );

      if (!registration) {
        alert(
          "找不到這筆報名資料。"
        );
        return;
      }

      const confirmed =
        window.confirm(
          `確定要取消「${registration.name}」的報名嗎？`
        );

      if (!confirmed) {
        return;
      }

      setCancellingId(
        registrationId
      );

      try {
        const {
          data,
          error,
        } = await supabase.rpc(
          "cancel_course_registration",
          {
            p_registration_id:
              registrationId,
          }
        );

        if (error) {
          console.error(
            "取消課程報名失敗：",
            error
          );

          alert(
            "取消報名失敗，請稍後再試。"
          );

          return;
        }

        const result =
          Array.isArray(data)
            ? data[0]
            : data;

        if (
          !result?.success
        ) {
          alert(
            result?.message ||
              "目前無法取消報名。"
          );

          return;
        }

        if (
          result.promoted_name
        ) {
          alert(
            `已取消「${registration.name}」的報名。\n「${result.promoted_name}」已從候補遞補為正取。`
          );
        } else {
          alert(
            `已取消「${registration.name}」的報名。`
          );
        }

        await reloadRegistrations();
      } catch (error) {
        console.error(
          "取消課程報名發生錯誤：",
          error
        );

        alert(
          "取消報名發生錯誤，請稍後再試。"
        );
      } finally {
        setCancellingId(
          null
        );
      }
    };

  return (
    <div
      style={{
        background:
          colors.card,
        borderRadius:
          radius.lg,
        boxShadow:
          shadow.md,
        padding: 24,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 24,
          color:
            colors.primary,
        }}
      >
        課程報名管理
      </h2>

      {!selectedCourse ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color:
              "#6B7280",
            background:
              "#F9FAFB",
            borderRadius:
              radius.md,
          }}
        >
          找不到目前課程資料
        </div>
      ) : (
        <>
          {/* 課程資訊 */}
          <div
            style={{
              padding: 20,
              background:
                "#F7FAFC",
              borderRadius:
                radius.md,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, 1fr)",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      "#6B7280",
                    fontSize: 13,
                  }}
                >
                  課程
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {
                    selectedCourse.title
                  }
                </div>
              </div>

              <div>
                <div
                  style={{
                    color:
                      "#6B7280",
                    fontSize: 13,
                  }}
                >
                  日期
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {formatDate(
                    selectedCourse.date
                  )}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color:
                      "#6B7280",
                    fontSize: 13,
                  }}
                >
                  正取人數
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {confirmedCount}
                  {" / "}
                  {
                    selectedCourse.capacity
                  }
                  {" 人"}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color:
                      "#6B7280",
                    fontSize: 13,
                  }}
                >
                  剩餘名額
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontWeight: 700,
                    color:
                      remainingSeats ===
                      0
                        ? "#DC2626"
                        : "#198754",
                  }}
                >
                  {remainingSeats}
                  {" 人"}
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div
              style={{
                marginBottom: 20,
                padding: 14,
                background:
                  "#F7FAFC",
                borderRadius:
                  radius.md,
                color:
                  "#6B7280",
                textAlign:
                  "center",
              }}
            >
              正在同步報名資料...
            </div>
          )}

          {/* 報名方式 */}
          <div
            style={{
              marginBottom: 20,
            }}
          >
            <div
              style={{
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              報名方式
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  handleModeChange(
                    "system"
                  )
                }
                style={{
                  padding:
                    "10px 18px",
                  borderRadius:
                    radius.md,
                  border:
                    registrationMode ===
                    "system"
                      ? "none"
                      : "1px solid #D1D5DB",
                  background:
                    registrationMode ===
                    "system"
                      ? colors.primary
                      : "#fff",
                  color:
                    registrationMode ===
                    "system"
                      ? "#fff"
                      : "#374151",
                  cursor:
                    "pointer",
                  fontWeight: 600,
                }}
              >
                系統內長者
              </button>

              <button
                type="button"
                onClick={() =>
                  handleModeChange(
                    "manual"
                  )
                }
                style={{
                  padding:
                    "10px 18px",
                  borderRadius:
                    radius.md,
                  border:
                    registrationMode ===
                    "manual"
                      ? "none"
                      : "1px solid #D1D5DB",
                  background:
                    registrationMode ===
                    "manual"
                      ? colors.primary
                      : "#fff",
                  color:
                    registrationMode ===
                    "manual"
                      ? "#fff"
                      : "#374151",
                  cursor:
                    "pointer",
                  fontWeight: 600,
                }}
              >
                非系統長者
              </button>
            </div>
          </div>

          {/* 系統長者 */}
          {registrationMode ===
            "system" && (
            <div
              style={{
                marginBottom: 20,
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                選擇長者
              </label>

              <select
                value={
                  selectedElderId ?? ""
                }
                onChange={(e) => {
                  const value =
                    e.target.value;

                  setSelectedElderId(
                    value
                      ? Number(
                          value
                        )
                      : null
                  );
                }}
                disabled={
                  saving ||
                  availableElders.length ===
                    0
                }
                style={{
                  width: "100%",
                  padding: 10,
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    radius.md,
                  boxSizing:
                    "border-box",
                  background:
                    "#fff",
                }}
              >
                <option value="">
                  {availableElders.length ===
                  0
                    ? "目前沒有可報名長者"
                    : "請選擇長者"}
                </option>

                {availableElders.map(
                  (elder) => (
                    <option
                      key={
                        elder.id
                      }
                      value={
                        elder.id
                      }
                    >
                      {
                        elder.name
                      }
                      {"　"}
                      {
                        elder.phone
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {/* 非系統長者 */}
          {registrationMode ===
            "manual" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <label
                  style={{
                    display:
                      "block",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  姓名
                </label>

                <input
                  type="text"
                  value={
                    manualName
                  }
                  onChange={(e) =>
                    setManualName(
                      e.target.value
                    )
                  }
                  placeholder="請輸入姓名"
                  style={{
                    width: "100%",
                    padding: 10,
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      radius.md,
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display:
                      "block",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  電話
                </label>

                <input
                  type="tel"
                  value={
                    manualPhone
                  }
                  onChange={(e) =>
                    setManualPhone(
                      e.target.value
                    )
                  }
                  placeholder="請輸入電話"
                  style={{
                    width: "100%",
                    padding: 10,
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      radius.md,
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {/* 新增報名 */}
          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={
                handleRegister
              }
              disabled={saving}
              style={{
                background:
                  colors.primary,
                color: "#fff",
                border: "none",
                borderRadius:
                  radius.md,
                padding:
                  "10px 20px",
                cursor:
                  saving
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
                opacity:
                  saving ? 0.5 : 1,
              }}
            >
              {saving
                ? "處理中..."
                : "＋ 新增報名"}
            </button>
          </div>
        </>
      )}

      {/* 正取名單 */}
      <div
        style={{
          marginTop: 28,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 12,
            color:
              colors.primary,
          }}
        >
          正取名單
        </h3>

        {confirmedRegistrations.length ===
        0 ? (
          <div
            style={{
              padding: 24,
              textAlign:
                "center",
              color:
                "#6B7280",
              background:
                "#F9FAFB",
              borderRadius:
                radius.md,
            }}
          >
            目前尚無正取報名
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "#F7FAFC",
                }}
              >
                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "left",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  姓名
                </th>

                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "left",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  電話
                </th>

                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "left",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  報名時間
                </th>

                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "center",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>

            <tbody>
              {confirmedRegistrations.map(
                (
                  registration
                ) => (
                  <tr
                    key={
                      registration.id
                    }
                  >
                    <td
                      style={{
                        padding: 12,
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      {
                        registration.name
                      }
                    </td>

                    <td
                      style={{
                        padding: 12,
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      {
                        registration.phone ||
                        "-"
                      }
                    </td>

                    <td
                      style={{
                        padding: 12,
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      {new Date(
                        registration.registeredAt
                      ).toLocaleString(
                        "zh-TW"
                      )}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        textAlign:
                          "center",
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleCancelRegistration(
                            registration.id
                          )
                        }
                        disabled={
                          cancellingId ===
                          registration.id
                        }
                        style={{
                          background:
                            "#DC2626",
                          color:
                            "#fff",
                          border:
                            "none",
                          borderRadius:
                            radius.sm,
                          padding:
                            "6px 12px",
                          cursor:
                            cancellingId ===
                            registration.id
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            cancellingId ===
                            registration.id
                              ? 0.5
                              : 1,
                        }}
                      >
                        {cancellingId ===
                        registration.id
                          ? "取消中..."
                          : "取消報名"}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 候補名單 */}
      <div
        style={{
          marginTop: 28,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 12,
            color:
              colors.primary,
          }}
        >
          候補名單
        </h3>

        {waitlistRegistrations.length ===
        0 ? (
          <div
            style={{
              padding: 24,
              textAlign:
                "center",
              color:
                "#6B7280",
              background:
                "#FFF7ED",
              borderRadius:
                radius.md,
            }}
          >
            目前沒有候補名單
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "#FFF7ED",
                }}
              >
                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "center",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  候補順位
                </th>

                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "left",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  姓名
                </th>

                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "left",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  電話
                </th>

                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "left",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  登記時間
                </th>

                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "center",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  狀態
                </th>

                <th
                  style={{
                    padding: 12,
                    textAlign:
                      "center",
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>

            <tbody>
              {waitlistRegistrations.map(
                (
                  registration
                ) => (
                  <tr
                    key={
                      registration.id
                    }
                  >
                    <td
                      style={{
                        padding: 12,
                        textAlign:
                          "center",
                        fontWeight: 700,
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      {registration.waitlistPosition ??
                        "-"}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      {
                        registration.name
                      }
                    </td>

                    <td
                      style={{
                        padding: 12,
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      {
                        registration.phone ||
                        "-"
                      }
                    </td>

                    <td
                      style={{
                        padding: 12,
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      {new Date(
                        registration.registeredAt
                      ).toLocaleString(
                        "zh-TW"
                      )}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        textAlign:
                          "center",
                        borderBottom:
                          "1px solid #F3F4F6",
                        fontWeight: 700,
                        color:
                          "#C2410C",
                      }}
                    >
                      候補
                    </td>

                    <td
                      style={{
                        padding: 12,
                        textAlign:
                          "center",
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleCancelRegistration(
                            registration.id
                          )
                        }
                        disabled={
                          cancellingId ===
                          registration.id
                        }
                        style={{
                          background:
                            "#DC2626",
                          color:
                            "#fff",
                          border:
                            "none",
                          borderRadius:
                            radius.sm,
                          padding:
                            "6px 12px",
                          cursor:
                            cancellingId ===
                            registration.id
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            cancellingId ===
                            registration.id
                              ? 0.5
                              : 1,
                        }}
                      >
                        {cancellingId ===
                        registration.id
                          ? "取消中..."
                          : "取消報名"}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}