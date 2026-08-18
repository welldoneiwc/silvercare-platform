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
  courseId?: number;
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

type CourseAvailability = {
  confirmed_count: number;
  capacity: number;
  remaining_seats: number;
};

type RegistrationResult = {
  success: boolean;
  registration_status:
    | "confirmed"
    | "waitlist"
    | null;
  waitlist_position:
    | number
    | null;
  confirmed_count: number;
  remaining_seats: number;
  message: string;
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
    availabilityLoading,
    setAvailabilityLoading,
  ] = useState(false);

  const [
    courseAvailability,
    setCourseAvailability,
  ] = useState<
    CourseAvailability | null
  >(null);

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    registrationStatus,
    setRegistrationStatus,
  ] = useState<
    "confirmed" | "waitlist" | null
  >(null);

  const [
    waitlistPosition,
    setWaitlistPosition,
  ] = useState<number | null>(
    null
  );

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
   * 從 Supabase 讀取課程目前名額
   *
   * 只取得：
   * - 已正取人數
   * - 課程容量
   * - 剩餘名額
   *
   * 不會取得其他報名者姓名與電話。
   */
  useEffect(() => {
    if (courseId === null) {
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      setAvailabilityLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase.rpc(
          "get_course_availability",
          {
            p_course_id: courseId,
          }
        );

        if (error) {
          console.error(
            "讀取課程名額失敗：",
            error
          );

          if (!cancelled) {
            setCourseAvailability(
              null
            );
          }

          return;
        }

        const result =
          Array.isArray(data)
            ? data[0]
            : data;

        if (!cancelled) {
          if (result) {
            setCourseAvailability({
              confirmed_count:
                Number(
                  result.confirmed_count ??
                    0
                ),
              capacity:
                Number(
                  result.capacity ??
                    0
                ),
              remaining_seats:
                Number(
                  result.remaining_seats ??
                    0
                ),
            });
          } else {
            setCourseAvailability(
              null
            );
          }
        }
      } catch (error) {
        console.error(
          "讀取課程名額失敗：",
          error
        );

        if (!cancelled) {
          setCourseAvailability(
            null
          );
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(
            false
          );
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  /*
   * 活動、長者與活動報名資料
   * 暫時仍維持 LocalStorage。
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
        "讀取活動報名資料失敗：",
        error
      );
    }

    setLoaded(true);
  }, []);

  /*
   * 活動報名資料仍寫回 LocalStorage
   *
   * 課程報名已改由 Supabase 處理，
   * 因此這裡只有活動資料會使用這份 state。
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
   * 課程容量
   *
   * 優先使用 Supabase availability。
   */
  const selectedCapacity =
    isCourse &&
    courseAvailability
      ? courseAvailability.capacity
      : selectedActivity?.capacity ??
        selectedCourse?.capacity ??
        0;

  /*
   * 活動目前報名資料
   *
   * 課程不再從 LocalStorage 計算。
   */
  const currentActivityRegistrations =
    useMemo(() => {
      if (!isActivity) {
        return [];
      }

      if (activityId === null) {
        return [];
      }

      return registrations.filter(
        (registration) =>
          registration.activityId ===
          activityId
      );
    }, [
      registrations,
      activityId,
      isActivity,
    ]);

  /*
   * 目前已正取人數
   */
  const confirmedCount =
    isCourse
      ? courseAvailability
        ? courseAvailability.confirmed_count
        : 0
      : currentActivityRegistrations.length;

  /*
   * 剩餘名額
   */
  const remainingSeats =
    isCourse
      ? courseAvailability
        ? courseAvailability.remaining_seats
        : 0
      : Math.max(
          selectedCapacity -
            currentActivityRegistrations.length,
          0
        );

  /*
   * 尋找既有長者
   *
   * 活動仍可沿用目前瀏覽器的長者資料。
   * 公開課程的新流程不依賴這個結果。
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
   * 活動使用原本的前端重複報名判斷。
   *
   * 課程改由 Supabase RPC 在資料庫內
   * 做真正的重複判斷。
   */
  const alreadyRegistered =
    useMemo(() => {
      if (isCourse) {
        return false;
      }

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

      return currentActivityRegistrations.some(
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
      currentActivityRegistrations,
      elders,
      isCourse,
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
   * 課程是否仍在等待名額資料
   */
  const courseDataLoading =
    isCourse &&
    (courseLoading ||
      availabilityLoading);

  /*
   * 報名
   */
  const handleSubmit = async () => {
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

    if (
      isActivity &&
      remainingSeats <= 0
    ) {
      alert(
        "此活動已額滿。"
      );
      return;
    }

    if (
      isActivity &&
      alreadyRegistered
    ) {
      alert(
        "您已經報名此活動，請勿重複報名。"
      );
      return;
    }

    if (
      isCourse &&
      courseId === null
    ) {
      alert(
        "找不到課程編號，請確認報名連結是否正確。"
      );
      return;
    }

    setSubmitting(true);

    try {
      /*
       * =========================
       * 課程：使用 Supabase RPC
       * =========================
       */
      if (isCourse) {
        const {
          data,
          error,
        } = await supabase.rpc(
          "register_for_course",
          {
            p_course_id: courseId,
            p_name: trimmedName,
            p_phone: normalizedPhone,
          }
        );

        if (error) {
          console.error(
            "課程報名失敗：",
            error
          );

          alert(
            "報名失敗，請稍後再試。"
          );

          return;
        }

        const result =
          (
            Array.isArray(data)
              ? data[0]
              : data
          ) as
            | RegistrationResult
            | undefined;

        if (!result) {
          alert(
            "報名系統沒有回傳結果，請稍後再試。"
          );

          return;
        }

        if (!result.success) {
          alert(
            result.message ||
              "目前無法完成報名。"
          );

          return;
        }

        setRegistrationStatus(
          result.registration_status
        );

        setWaitlistPosition(
          result.waitlist_position
        );

        setCourseAvailability({
          confirmed_count:
            Number(
              result.confirmed_count ??
                0
            ),
          capacity:
            courseAvailability?.capacity ??
            selectedCapacity,
          remaining_seats:
            Number(
              result.remaining_seats ??
                0
            ),
        });

        setName("");
        setPhone("");
        setSubmitted(true);

        return;
      }

      /*
       * =========================
       * 活動：維持 LocalStorage
       * =========================
       */
      const newRegistration: StoredRegistration =
        {
          id: Date.now(),

          ...(activityId !== null
            ? {
                activityId:
                  activityId,
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

      setRegistrationStatus(
        "confirmed"
      );

      setWaitlistPosition(
        null
      );

      setName("");
      setPhone("");
      setSubmitted(true);
    } catch (error) {
      console.error(
        "報名發生錯誤：",
        error
      );

      alert(
        "報名發生錯誤，請稍後再試。"
      );
    } finally {
      setSubmitting(false);
    }
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
   * 課程載入中
   */
  if (courseDataLoading) {
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
   * 報名成功 / 候補畫面
   */
  if (submitted) {
    const isWaitlist =
      isCourse &&
      registrationStatus ===
        "waitlist";

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
              {isWaitlist
                ? "候補登記成功"
                : "報名成功"}
            </h1>

            <p
              style={{
                margin: 0,
                color:
                  "#6B7280",
                lineHeight: 1.8,
              }}
            >
              {isWaitlist
                ? "您的資料已加入候補名單："
                : "您已成功報名："}
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

            {isWaitlist &&
              waitlistPosition !==
                null && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    background:
                      "#FFF7ED",
                    borderRadius:
                      radius.md,
                    color:
                      "#C2410C",
                    fontWeight: 700,
                    textAlign:
                      "center",
                  }}
                >
                  您目前為候補第{" "}
                  {
                    waitlistPosition
                  }{" "}
                  位
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
            {isWaitlist
              ? "若有名額釋出，將依候補順序通知。"
              : "請依據點通知的時間準時參加。"}
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
                confirmedCount
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
              {isCourse &&
              remainingSeats === 0
                ? "目前狀態"
                : "剩餘名額"}
            </span>

            <strong
              style={{
                color:
                  isCourse &&
                  remainingSeats ===
                    0
                    ? "#C2410C"
                    : remainingSeats ===
                        0
                      ? "#DC2626"
                      : "#198754",
                fontSize: 18,
              }}
            >
              {isCourse &&
              remainingSeats ===
                0
                ? "已額滿，可候補"
                : `${remainingSeats} 人`}
            </strong>
          </div>
        </div>

        {isCourse &&
        remainingSeats === 0 ? (
          <>
            <div
              style={{
                padding: 16,
                background:
                  "#FFF7ED",
                borderRadius:
                  radius.md,
                color:
                  "#C2410C",
                textAlign:
                  "center",
                marginBottom: 24,
                lineHeight: 1.7,
              }}
            >
              此課程目前已額滿，
              <br />
              仍可登記候補。
            </div>

            <h2
              style={{
                marginTop: 0,
                color:
                  colors.primary,
                fontSize: 20,
              }}
            >
              登記候補
            </h2>

            <p
              style={{
                color:
                  "#6B7280",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              若有名額釋出，
              將依候補順序通知。
            </p>

            <RegistrationForm
              name={name}
              phone={phone}
              setName={setName}
              setPhone={setPhone}
              matchedElder={matchedElder}
              alreadyRegistered={
                alreadyRegistered
              }
              submitting={submitting}
              handleSubmit={
                handleSubmit
              }
              buttonText={
                "加入候補名單"
              }
            />
          </>
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

            <RegistrationForm
              name={name}
              phone={phone}
              setName={setName}
              setPhone={setPhone}
              matchedElder={matchedElder}
              alreadyRegistered={
                alreadyRegistered
              }
              submitting={submitting}
              handleSubmit={
                handleSubmit
              }
              buttonText={
                isActivity
                  ? "確認報名"
                  : "確認報名"
              }
            />
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

type RegistrationFormProps = {
  name: string;
  phone: string;
  setName: (
    value: string
  ) => void;
  setPhone: (
    value: string
  ) => void;
  matchedElder: Elder | null;
  alreadyRegistered: boolean;
  submitting: boolean;
  handleSubmit: () => void;
  buttonText: string;
};

function RegistrationForm({
  name,
  phone,
  setName,
  setPhone,
  matchedElder,
  alreadyRegistered,
  submitting,
  handleSubmit,
  buttonText,
}: RegistrationFormProps) {
  return (
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
          style={labelStyle}
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
          }}
          placeholder="請輸入您的姓名"
          style={inputStyle}
        />
      </div>

      <div>
        <label
          style={labelStyle}
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
          }}
          placeholder="請輸入您的電話"
          style={inputStyle}
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
          您已經報名此活動，
          無需重複報名。
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
          color: "#fff",
          border: "none",
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
          ? "處理中..."
          : alreadyRegistered
            ? "已完成報名"
            : buttonText}
      </button>
    </div>
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