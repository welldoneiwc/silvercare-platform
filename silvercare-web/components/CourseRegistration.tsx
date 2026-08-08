"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

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

  /**
   * 系統內長者才會有 elderId
   * 手動輸入的非系統長者可以沒有 elderId
   */
  elderId?: number;

  /**
   * 報名時實際留下的姓名與電話
   *
   * 即使之後長者資料被修改，
   * 報名紀錄仍保留當時資料。
   */
  name: string;
  phone: string;

  registeredAt: string;
};

type Props = {
  course: Course | null;
};

const COURSE_STORAGE_KEY =
  "silvercare-courses";

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
  ] = useState<CourseRegistration[]>(
    []
  );

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
  ] = useState<"system" | "manual">(
    "system"
  );

  const [loaded, setLoaded] =
    useState(false);

  /**
   * 第一次讀取資料
   */
  useEffect(() => {
    try {
      const savedCourses =
        localStorage.getItem(
          COURSE_STORAGE_KEY
        );

      if (savedCourses) {
        const parsedCourses =
          JSON.parse(savedCourses);

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
          JSON.parse(savedElders);

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
          const normalizedRegistrations =
            parsedRegistrations.map(
              (
                item: CourseRegistration
              ) => {
                const elder =
                  elders.find(
                    (elder) =>
                      elder.id ===
                      item.elderId
                  );

                return {
                  ...item,

                  name:
                    item.name ||
                    elder?.name ||
                    "未知長者",

                  phone:
                    item.phone ||
                    elder?.phone ||
                    "",
                };
              }
            );

          setRegistrations(
            normalizedRegistrations
          );
        }
      }
    } catch (error) {
      console.error(
        "讀取課程報名資料失敗：",
        error
      );
    }

    setLoaded(true);
  }, []);

  /**
   * 報名資料寫入 LocalStorage
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

  /**
   * 同步目前傳入的課程
   *
   * 課程管理已經指定是哪一門課，
   * 因此這裡不再要求管理員重新選擇課程。
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
    }, [
      courseRegistrations,
    ]);

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
   * 剩餘名額
   */
  const remainingSeats =
    selectedCourse
      ? Math.max(
          selectedCourse.capacity -
            courseRegistrations.length,
          0
        )
      : 0;

  /**
   * 切換報名方式
   */
  const handleModeChange = (
    mode: "system" | "manual"
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
   */
  const handleRegister = () => {
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

    if (
      courseRegistrations.length >=
      selectedCourse.capacity
    ) {
      alert(
        "此課程已額滿"
      );
      return;
    }

    /**
     * 系統長者報名
     */
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

      const alreadyRegistered =
        courseRegistrations.some(
          (registration) =>
            registration.elderId ===
            selectedElderId
        );

      if (
        alreadyRegistered
      ) {
        alert(
          "這位長者已經報名此課程"
        );
        return;
      }

      const newRegistration: CourseRegistration =
        {
          id: Date.now(),

          courseId:
            selectedCourse.id,

          elderId:
            selectedElder.id,

          name:
            selectedElder.name,

          phone:
            selectedElder.phone,

          registeredAt:
            new Date().toISOString(),
        };

      setRegistrations(
        (prev) => [
          ...prev,
          newRegistration,
        ]
      );

      setSelectedElderId(
        null
      );

      alert(
        "報名成功"
      );

      return;
    }

    /**
     * 非系統長者手動輸入
     */
    const name =
      manualName.trim();

    const phone =
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

    /**
     * 用電話避免同一個人重複報名
     */
    const duplicate =
      courseRegistrations.some(
        (registration) =>
          registration.phone ===
          phone
      );

    if (duplicate) {
      alert(
        "這個電話已經報名此課程"
      );
      return;
    }

    const newRegistration: CourseRegistration =
      {
        id: Date.now(),

        courseId:
          selectedCourse.id,

        name,

        phone,

        registeredAt:
          new Date().toISOString(),
      };

    setRegistrations(
      (prev) => [
        ...prev,
        newRegistration,
      ]
    );

    setManualName("");

    setManualPhone("");

    alert(
      "報名成功"
    );
  };

  /**
   * 取消報名
   */
  const handleCancelRegistration =
    (
      registrationId: number
    ) => {
      const confirmed =
        window.confirm(
          "確定要取消這筆報名嗎？"
        );

      if (!confirmed) {
        return;
      }

      setRegistrations(
        (prev) =>
          prev.filter(
            (registration) =>
              registration.id !==
              registrationId
          )
      );
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
                  已報名
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {
                    courseRegistrations.length
                  }
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
                  {
                    remainingSeats
                  }
                  {" 人"}
                </div>
              </div>
            </div>
          </div>

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
                  selectedElderId ??
                  ""
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
                  remainingSeats ===
                    0 ||
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
                  {remainingSeats ===
                  0
                    ? "課程已額滿"
                    : availableElders.length ===
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
              disabled={
                remainingSeats ===
                0
              }
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
                  remainingSeats ===
                  0
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
                opacity:
                  remainingSeats ===
                  0
                    ? 0.5
                    : 1,
              }}
            >
              ＋ 新增報名
            </button>
          </div>
        </>
      )}

      {/* 已報名名單 */}
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
          已報名長者
        </h3>

        {!selectedCourse ? (
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
            找不到目前課程資料
          </div>
        ) : courseRegistrations.length ===
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
            目前尚無報名長者
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
              {courseRegistrations.map(
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
                            "pointer",
                        }}
                      >
                        取消報名
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