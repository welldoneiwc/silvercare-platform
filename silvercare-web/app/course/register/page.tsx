"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { colors } from "../../../styles/theme";
import { radius } from "../../../styles/radius";
import { shadow } from "../../../styles/shadow";
import { supabase } from "../../../utils/supabase";

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

type Activity = {
  id: number;
  date: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  note: string;
};

type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};

type StoredRegistration = {
  id: number;

  /*
   * 課程報名使用 courseId
   */
  courseId?: number;

  /*
   * 活動報名使用 activityId
   */
  activityId?: number;

  elderId?: number;
  name?: string;
  phone?: string;
  registeredAt: string;
};

type SupabaseCourse = {
  id: number;
  date: string;
  title: string;
  teacher: string;
  start_time: string;
  end_time: string;
  capacity: number;
  classroom: string | null;
  note: string | null;
};

const ACTIVITY_STORAGE_KEY =
  "silvercare-activities";

const ELDER_STORAGE_KEY =
  "silvercare-elders";

const REGISTRATION_STORAGE_KEY =
  "silvercare-course-registrations";

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

function getStoredElderName(
  registration: StoredRegistration,
  elders: Elder[]
) {
  if (registration.name) {
    return registration.name;
  }

  if (
    registration.elderId !==
    undefined
  ) {
    const elder = elders.find(
      (item) =>
        item.id ===
        registration.elderId
    );

    if (elder) {
      return elder.name;
    }
  }

  return "未知長者";
}

function getStoredElderPhone(
  registration: StoredRegistration,
  elders: Elder[]
) {
  if (registration.phone) {
    return registration.phone;
  }

  if (
    registration.elderId !==
    undefined
  ) {
    const elder = elders.find(
      (item) =>
        item.id ===
        registration.elderId
    );

    if (elder) {
      return elder.phone;
    }
  }

  return "";
}

function mapSupabaseCourse(
  course: SupabaseCourse
): Course {
  return {
    id: course.id,
    date: course.date ?? "",
    title: course.title ?? "",
    teacher: course.teacher ?? "",
    startTime:
      course.start_time ?? "",
    endTime:
      course.end_time ?? "",
    capacity:
      course.capacity ?? 0,
    classroom:
      course.classroom ?? "",
    note: course.note ?? "",
  };
}

export default function CourseRegisterPage() {
  const [courses, setCourses] =
    useState<Course[]>([]);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [elders, setElders] =
    useState<Elder[]>([]);

  const [
    registrations,
    setRegistrations,
  ] = useState<
    StoredRegistration[]
  >([]);

  /*
   * 目前可能是課程或活動
   */
  const [courseId, setCourseId] =
    useState<number | null>(null);

  const [
    activityId,
    setActivityId,
  ] = useState<number | null>(
    null
  );

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [loaded, setLoaded] =
    useState(false);

  const [
    courseLoading,
    setCourseLoading,
  ] = useState(false);

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  /*
   * 讀取網址上的
   * courseId / activityId
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const courseValue =
      params.get("courseId");

    const activityValue =
      params.get("activityId");

    if (courseValue) {
      const parsed =
        Number(courseValue);

      if (
        Number.isFinite(parsed)
      ) {
        setCourseId(parsed);
      }
    }

    if (activityValue) {
      const parsed =
        Number(activityValue);

      if (
        Number.isFinite(parsed)
      ) {
        setActivityId(parsed);
      }
    }
  }, []);

  /*
   * 從 Supabase 讀取目前課程
   *
   * 公開報名頁不能依賴建立課程那台
   * 電腦的 LocalStorage。
   *
   * 使用網址上的 courseId，
   * 直接從 courses 資料表查詢。
   */
  useEffect(() => {
    if (courseId === null) {
      return;
    }

    let cancelled = false;

    async function loadCourse() {
      setCourseLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("courses")
          .select(
            "id, date, title, teacher, start_time, end_time, capacity, classroom, note"
          )
          .eq("id", courseId)
          .maybeSingle();

        if (error) {
          console.error(
            "讀取公開課程失敗：",
            error
          );

          if (!cancelled) {
            setCourses([]);
          }

          return;
        }

        if (!cancelled) {
          if (data) {
            setCourses([
              mapSupabaseCourse(
                data as SupabaseCourse
              ),
            ]);
          } else {
            setCourses([]);
          }
        }
      } catch (error) {
        console.error(
          "讀取公開課程失敗：",
          error
        );

        if (!cancelled) {
          setCourses([]);
        }
      } finally {
        if (!cancelled) {
          setCourseLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  /*
   * 讀取活動、長者
   * 與目前報名資料
   */
  useEffect(() => {
    try {
      const savedActivities =
        localStorage.getItem(
          ACTIVITY_STORAGE_KEY
        );

      if (savedActivities) {
        const parsedActivities =
          JSON.parse(
            savedActivities
          );

        if (
          Array.isArray(
            parsedActivities
          )
        ) {
          setActivities(
            parsedActivities
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

      const savedRegistrations =
        localStorage.getItem(
          REGISTRATION_STORAGE_KEY
        );

      if (
        savedRegistrations
      ) {
        const parsedRegistrations =
          JSON.parse(
            savedRegistrations
          );

        if (
          Array.isArray(
            parsedRegistrations
          )
        ) {
          setRegistrations(
            parsedRegistrations
          );
        }
      }
    } catch (error) {
      console.error(
        "讀取報名資料失敗：",
        error
      );
    }

    setLoaded(true);
  }, []);

  /*
   * 報名資料寫回 LocalStorage
   */
  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      REGISTRATION_STORAGE_KEY,
      JSON.stringify(
        registrations
      )
    );
  }, [
    registrations,
    loaded,
  ]);

  /*
   * 找到目前課程
   */
  const selectedCourse =
    useMemo(() => {
      if (courseId === null) {
        return null;
      }

      return (
        courses.find(
          (course) =>
            course.id ===
            courseId
        ) || null
      );
    }, [
      courses,
      courseId,
    ]);

  /*
   * 找到目前活動
   */
  const selectedActivity =
    useMemo(() => {
      if (activityId === null) {
        return null;
      }

      return (
        activities.find(
          (activity) =>
            activity.id ===
            activityId
        ) || null
      );
    }, [
      activities,
      activityId,
    ]);

  /*
   * 目前是否為活動報名
   */
  const isActivity =
    activityId !== null;

  /*
   * 目前是否為課程報名
   */
  const isCourse =
    courseId !== null &&
    activityId === null;

  /*
   * 目前顯示的名稱
   */
  const selectedTitle =
    selectedActivity?.title ??
    selectedCourse?.title ??
    "";

  /*
   * 目前日期
   */
  const selectedDate =
    selectedActivity?.date ??
    selectedCourse?.date ??
    "";

  /*
   * 目前開始時間
   */
  const selectedStartTime =
    selectedActivity?.startTime ??
    selectedCourse?.startTime ??
    "";

  /*
   * 目前結束時間
   */
  const selectedEndTime =
    selectedActivity?.endTime ??
    selectedCourse?.endTime ??
    "";

  /*
   * 活動地點 / 課程教室
   */
  const selectedLocation =
    selectedActivity?.location ??
    selectedCourse?.classroom ??
    "";

  /*
   * 課程老師
   */
  const selectedTeacher =
    selectedCourse?.teacher ??
    "";

  /*
   * 目前容量
   */
  const selectedCapacity =
    selectedActivity?.capacity ??
    selectedCourse?.capacity ??
    0;

  /*
   * 目前對應的報名資料
   */
  const currentRegistrations =
    useMemo(() => {
      if (isActivity) {
        if (activityId === null) {
          return [];
        }

        return registrations.filter(
          (registration) =>
            registration.activityId ===
            activityId
        );
      }

      if (isCourse) {
        if (courseId === null) {
          return [];
        }

        return registrations.filter(
          (registration) =>
            registration.courseId ===
            courseId
        );
      }

      return [];
    }, [
      registrations,
      activityId,
      courseId,
      isActivity,
      isCourse,
    ]);

  /*
   * 剩餘名額
   */
  const remainingSeats =
    Math.max(
      selectedCapacity -
        currentRegistrations.length,
      0
    );

  /*
   * 尋找既有長者
   *
   * 姓名 + 電話都符合
   * 才視為系統內長者
   */
  const matchedElder =
    useMemo(() => {
      const trimmedName =
        name.trim();

      const trimmedPhone =
        normalizePhone(phone);

      if (
        !trimmedName ||
        !trimmedPhone
      ) {
        return null;
      }

      return (
        elders.find(
          (elder) =>
            elder.name.trim() ===
              trimmedName &&
            normalizePhone(
              elder.phone
            ) ===
              trimmedPhone
        ) || null
      );
    }, [
      elders,
      name,
      phone,
    ]);

  /*
   * 判斷是否已經報名
   *
   * 同時兼容：
   * 1. elderId
   * 2. name / phone
   */
  const alreadyRegistered =
    useMemo(() => {
      const trimmedName =
        name.trim();

      const trimmedPhone =
        normalizePhone(phone);

      if (
        !trimmedName ||
        !trimmedPhone
      ) {
        return false;
      }

      return currentRegistrations.some(
        (registration) => {
          if (
            matchedElder &&
            registration.elderId ===
              matchedElder.id
          ) {
            return true;
          }

          const registrationName =
            getStoredElderName(
              registration,
              elders
            ).trim();

          const registrationPhone =
            normalizePhone(
              getStoredElderPhone(
                registration,
                elders
              )
            );

          return (
            registrationName ===
              trimmedName &&
            registrationPhone ===
              trimmedPhone
          );
        }
      );
    }, [
      currentRegistrations,
      elders,
      matchedElder,
      name,
      phone,
    ]);

  /*
   * 找不到目前項目
   */
  const hasSelectedItem =
    isActivity
      ? selectedActivity !== null
      : isCourse
        ? selectedCourse !== null
        : false;

  /*
   * 報名
   */
  const handleSubmit = () => {
    if (!hasSelectedItem) {
      alert(
        "找不到這個活動或課程，請確認報名連結是否正確。"
      );
      return;
    }

    const trimmedName =
      name.trim();

    const trimmedPhone =
      phone.trim();

    const normalizedPhone =
      normalizePhone(phone);

    if (!trimmedName) {
      alert("請輸入姓名。");
      return;
    }

    if (!trimmedPhone) {
      alert("請輸入電話。");
      return;
    }

    if (
      normalizedPhone.length < 8
    ) {
      alert(
        "請輸入正確的電話號碼。"
      );
      return;
    }

    if (remainingSeats <= 0) {
      alert(
        isActivity
          ? "此活動已額滿。"
          : "此課程已額滿。"
      );
      return;
    }

    if (alreadyRegistered) {
      alert(
        "您已經報名此活動，請勿重複報名。"
      );
      return;
    }

    setSubmitting(true);

    const newRegistration: StoredRegistration =
      {
        id: Date.now(),

        /*
         * 活動報名
         */
        ...(isActivity &&
        activityId !== null
          ? {
              activityId:
                activityId,
            }
          : {}),

        /*
         * 課程報名
         */
        ...(isCourse &&
        courseId !== null
          ? {
              courseId:
                courseId,
            }
          : {}),

        elderId:
          matchedElder?.id,

        name:
          trimmedName,

        phone:
          trimmedPhone,

        registeredAt:
          new Date().toISOString(),
      };

    setRegistrations(
      (prev) => [
        ...prev,
        newRegistration,
      ]
    );

    setName("");
    setPhone("");
    setSubmitted(true);
    setSubmitting(false);
  };

  /*
   * 沒有 courseId / activityId
   */
  if (
    courseId === null &&
    activityId === null
  ) {
    return (
      <main
        style={pageStyle}
      >
        <div
          style={cardStyle}
        >
          <h1
            style={titleStyle}
          >
            SilverCare 報名
          </h1>

          <div
            style={{
              padding: 20,
              background:
                "#FEF2F2",
              borderRadius:
                radius.md,
              color:
                "#B91C1C",
              textAlign:
                "center",
            }}
          >
            找不到報名對象，
            請確認報名連結是否正確。
          </div>
        </div>
      </main>
    );
  }

  /*
   * Supabase 正在讀取課程
   */
  if (
    isCourse &&
    courseLoading
  ) {
    return (
      <main
        style={pageStyle}
      >
        <div
          style={cardStyle}
        >
          <h1
            style={titleStyle}
          >
            SilverCare 報名
          </h1>

          <div
            style={{
              padding: 20,
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
            正在讀取課程資料...
          </div>
        </div>
      </main>
    );
  }

  /*
   * 找不到課程或活動
   */
  if (!hasSelectedItem) {
    return (
      <main
        style={pageStyle}
      >
        <div
          style={cardStyle}
        >
          <h1
            style={titleStyle}
          >
            SilverCare 報名
          </h1>

          <div
            style={{
              padding: 20,
              background:
                "#FEF2F2",
              borderRadius:
                radius.md,
              color:
                "#B91C1C",
              textAlign:
                "center",
            }}
          >
            找不到這個活動或課程，
            請確認報名連結是否正確。
          </div>
        </div>
      </main>
    );
  }

  /*
   * 報名成功畫面
   */
  if (submitted) {
    return (
      <main
        style={pageStyle}
      >
        <div
          style={cardStyle}
        >
          <div
            style={{
              textAlign:
                "center",
              marginBottom:
                24,
            }}
          >
            <h1
              style={titleStyle}
            >
              報名成功
            </h1>

            <p
              style={{
                margin: 0,
                color:
                  "#6B7280",
                lineHeight: 1.8,
              }}
            >
              您已成功報名：
            </p>
          </div>

          <div
            style={{
              background:
                "#F7FAFC",
              borderRadius:
                radius.md,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color:
                  colors.primary,
              }}
            >
              {selectedTitle}
            </div>

            <div
              style={{
                marginTop: 8,
                color:
                  "#6B7280",
              }}
            >
              {formatDate(
                selectedDate
              )}
              {"　"}
              {
                selectedStartTime
              }
              {" ~ "}
              {
                selectedEndTime
              }
            </div>

            {selectedTeacher && (
              <div
                style={{
                  marginTop: 4,
                  color:
                    "#6B7280",
                }}
              >
                老師：
                {
                  selectedTeacher
                }
              </div>
            )}

            {selectedLocation && (
              <div
                style={{
                  marginTop: 4,
                  color:
                    "#6B7280",
                }}
              >
                地點：
                {
                  selectedLocation
                }
              </div>
            )}
          </div>

          <p
            style={{
              color:
                "#374151",
              textAlign:
                "center",
              lineHeight: 1.8,
            }}
          >
            請依據點通知的時間準時參加。
          </p>

          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop:
                "1px solid #E5E7EB",
              textAlign:
                "center",
              color:
                "#9CA3AF",
              fontSize: 12,
            }}
          >
            SilverCare
            智慧據點管理平台
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={pageStyle}
    >
      <div
        style={cardStyle}
      >
        <div
          style={{
            textAlign:
              "center",
            marginBottom:
              28,
          }}
        >
          <h1
            style={titleStyle}
          >
            SilverCare
            {isActivity
              ? " 活動報名"
              : " 課程報名"}
          </h1>

          <p
            style={{
              margin: 0,
              color:
                "#6B7280",
            }}
          >
            歡迎報名據點
            {isActivity
              ? "活動"
              : "課程"}
          </p>
        </div>

        {/* 活動 / 課程資訊 */}
        <div
          style={{
            background:
              "#F7FAFC",
            borderRadius:
              radius.md,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              color:
                "#6B7280",
              fontSize: 13,
            }}
          >
            {isActivity
              ? "活動名稱"
              : "課程名稱"}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 22,
              fontWeight: 700,
              color:
                colors.primary,
            }}
          >
            {selectedTitle}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 12,
              marginTop: 16,
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
                日期
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                {formatDate(
                  selectedDate
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
                時間
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                {
                  selectedStartTime
                }
                {" ~ "}
                {
                  selectedEndTime
                }
              </div>
            </div>

            {isCourse && (
              <div>
                <div
                  style={{
                    color:
                      "#6B7280",
                    fontSize: 13,
                  }}
                >
                  老師
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {
                    selectedTeacher ||
                    "-"
                  }
                </div>
              </div>
            )}

            <div>
              <div
                style={{
                  color:
                    "#6B7280",
                  fontSize: 13,
                }}
              >
                {isActivity
                  ? "地點"
                  : "教室"}
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                {
                  selectedLocation ||
                  "-"
                }
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop:
                "1px solid #E5E7EB",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
            }}
          >
            <span
              style={{
                color:
                  "#6B7280",
              }}
            >
              已報名人數
            </span>

            <strong
              style={{
                color:
                  colors.primary,
                fontSize: 18,
              }}
            >
              {
                currentRegistrations.length
              }
              {" / "}
              {selectedCapacity}
              {" 人"}
            </strong>
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
            }}
          >
            <span
              style={{
                color:
                  "#6B7280",
              }}
            >
              剩餘名額
            </span>

            <strong
              style={{
                color:
                  remainingSeats ===
                  0
                    ? "#DC2626"
                    : "#198754",
                fontSize: 18,
              }}
            >
              {remainingSeats} 人
            </strong>
          </div>
        </div>

        {remainingSeats === 0 ? (
          <div
            style={{
              padding: 20,
              background:
                "#FEF2F2",
              borderRadius:
                radius.md,
              color:
                "#B91C1C",
              textAlign:
                "center",
            }}
          >
            此
            {isActivity
              ? "活動"
              : "課程"}
            已額滿，
            暫時無法報名。
          </div>
        ) : (
          <>
            <h2
              style={{
                marginTop: 0,
                color:
                  colors.primary,
                fontSize: 20,
              }}
            >
              填寫報名資料
            </h2>

            <p
              style={{
                color:
                  "#6B7280",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              不需要先加入系統。
              <br />
              直接輸入您的姓名與電話即可報名。
            </p>

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 18,
                marginTop: 20,
              }}
            >
              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  姓名
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(
                      e.target.value
                    );

                    setSubmitted(
                      false
                    );
                  }}
                  placeholder="請輸入您的姓名"
                  style={
                    inputStyle
                  }
                />
              </div>

              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  電話
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(
                      e.target.value
                    );

                    setSubmitted(
                      false
                    );
                  }}
                  placeholder="請輸入您的電話"
                  style={
                    inputStyle
                  }
                />
              </div>

              {matchedElder && (
                <div
                  style={{
                    padding: 14,
                    background:
                      "#ECFDF5",
                    borderRadius:
                      radius.md,
                    color:
                      "#047857",
                    fontSize: 14,
                  }}
                >
                  ✓ 已找到您的長者資料，
                  報名後會自動對應到系統中的長者。
                </div>
              )}

              {alreadyRegistered && (
                <div
                  style={{
                    padding: 14,
                    background:
                      "#FEF2F2",
                    borderRadius:
                      radius.md,
                    color:
                      "#B91C1C",
                    fontSize: 14,
                  }}
                >
                  您已經報名此
                  {isActivity
                    ? "活動"
                    : "課程"}
                  ，無需重複報名。
                </div>
              )}

              <button
                type="button"
                onClick={
                  handleSubmit
                }
                disabled={
                  submitting ||
                  alreadyRegistered
                }
                style={{
                  width: "100%",
                  marginTop: 4,
                  background:
                    colors.primary,
                  color:
                    "#fff",
                  border:
                    "none",
                  borderRadius:
                    radius.md,
                  padding:
                    "13px 20px",
                  cursor:
                    submitting ||
                    alreadyRegistered
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 700,
                  fontSize: 16,
                  opacity:
                    submitting ||
                    alreadyRegistered
                      ? 0.5
                      : 1,
                }}
              >
                {submitting
                  ? "報名中..."
                  : alreadyRegistered
                    ? "已完成報名"
                    : "確認報名"}
              </button>
            </div>
          </>
        )}

        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop:
              "1px solid #E5E7EB",
            textAlign:
              "center",
            color:
              "#9CA3AF",
            fontSize: 12,
          }}
        >
          SilverCare
          智慧據點管理平台
        </div>
      </div>
    </main>
  );
}

const pageStyle:
  React.CSSProperties = {
    minHeight: "100vh",
    background:
      colors.background,
    padding: 24,
    display: "flex",
    justifyContent:
      "center",
    alignItems:
      "flex-start",
    boxSizing:
      "border-box",
  };

const cardStyle:
  React.CSSProperties = {
    width: "100%",
    maxWidth: 620,
    background: "#fff",
    borderRadius:
      radius.lg,
    boxShadow:
      shadow.md,
    padding: 28,
    boxSizing:
      "border-box",
  };

const titleStyle:
  React.CSSProperties = {
    marginTop: 0,
    marginBottom: 8,
    color: colors.primary,
    fontSize: 28,
  };

const labelStyle:
  React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontWeight: 600,
    color: "#374151",
  };

const inputStyle:
  React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border:
      "1px solid #D1D5DB",
    borderRadius:
      radius.md,
    boxSizing:
      "border-box",
    fontSize: 16,
    outline: "none",
    background: "#fff",
  };