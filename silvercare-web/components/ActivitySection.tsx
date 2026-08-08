"use client";

import {
  useEffect,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

export type Activity = {
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

const STORAGE_KEY =
  "silvercare-activities";

const COURSE_STORAGE_KEY =
  "silvercare-courses";

const emptyForm = {
  date: "",
  title: "",
  type: "",
  startTime: "",
  endTime: "",
  location: "",
  capacity: "",
  note: "",
};

export default function ActivitySection() {
  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [openModal, setOpenModal] =
    useState(false);

  const [
    editingActivity,
    setEditingActivity,
  ] = useState<Activity | null>(
    null
  );

  const [form, setForm] =
    useState(emptyForm);

  /*
   * 第一次載入 LocalStorage
   */
  useEffect(() => {
    const savedActivities =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!savedActivities) {
      setActivities([]);
    } else {
      try {
        const parsed =
          JSON.parse(
            savedActivities
          );

        if (Array.isArray(parsed)) {
          setActivities(parsed);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error(
          "讀取活動資料失敗：",
          error
        );

        setActivities([]);
      }
    }

    /*
     * 讀取課程資料
     *
     * 活動管理中的「報名管理」
     * 需要找到對應的 Course ID，
     * 才能連到：
     *
     * /course/register?courseId=xxx
     */
    const savedCourses =
      localStorage.getItem(
        COURSE_STORAGE_KEY
      );

    if (savedCourses) {
      try {
        const parsedCourses =
          JSON.parse(
            savedCourses
          );

        if (Array.isArray(parsedCourses)) {
          setCourses(
            parsedCourses
          );
        }
      } catch (error) {
        console.error(
          "讀取課程資料失敗：",
          error
        );

        setCourses([]);
      }
    }

    setLoaded(true);
  }, []);

  /*
   * 寫回活動 LocalStorage
   *
   * 第一次讀取完成後才執行
   */
  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(activities)
    );
  }, [
    activities,
    loaded,
  ]);

  /*
   * 找到活動對應的課程
   *
   * 目前 Activity 與 Course
   * 是兩組不同資料。
   *
   * 因此先使用：
   *
   * 活動名稱
   * + 日期
   * + 開始時間
   * + 結束時間
   *
   * 找到對應 Course。
   */
  const findMatchingCourse = (
    activity: Activity
  ) => {
    return courses.find(
      (course) =>
        course.title ===
          activity.title &&
        course.date ===
          activity.date &&
        course.startTime ===
          activity.startTime &&
        course.endTime ===
          activity.endTime
    );
  };

  /*
   * 開啟報名管理
   */
  const handleRegistration = (
    activity: Activity
  ) => {
    /*
     * 只有課程活動才進入
     * 課程報名頁
     */
    if (
      activity.type !==
      "課程活動"
    ) {
      alert(
        "這個活動不是課程活動，目前沒有課程報名頁。"
      );

      return;
    }

    const matchedCourse =
      findMatchingCourse(
        activity
      );

    if (
      !matchedCourse ||
      matchedCourse.id ===
        undefined
    ) {
      alert(
        "找不到對應的課程資料。\n\n請確認活動名稱、日期、開始時間與結束時間是否與課程管理中的課程一致。"
      );

      return;
    }

    /*
     * 直接前往指定課程的
     * 公開報名頁
     */
    window.location.href =
      `/course/register?courseId=${matchedCourse.id}`;
  };

  /*
   * 開啟新增
   */
  const handleOpenAdd = () => {
    setEditingActivity(null);

    setForm({
      ...emptyForm,
      date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setOpenModal(true);
  };

  /*
   * 開啟編輯
   */
  const handleOpenEdit = (
    activity: Activity
  ) => {
    setEditingActivity(activity);

    setForm({
      date: activity.date,
      title: activity.title,
      type: activity.type,
      startTime:
        activity.startTime,
      endTime:
        activity.endTime,
      location:
        activity.location,
      capacity:
        String(activity.capacity),
      note: activity.note,
    });

    setOpenModal(true);
  };

  /*
   * 儲存活動
   */
  const handleSave = () => {
    if (!form.title.trim()) {
      alert("請輸入活動名稱");
      return;
    }

    if (!form.date) {
      alert("請選擇活動日期");
      return;
    }

    if (!form.startTime) {
      alert("請選擇開始時間");
      return;
    }

    if (!form.endTime) {
      alert("請選擇結束時間");
      return;
    }

    const capacity =
      Number(form.capacity);

    if (
      !form.capacity ||
      capacity <= 0
    ) {
      alert("請輸入正確的活動人數");
      return;
    }

    if (editingActivity) {
      setActivities((prev) =>
        prev.map((item) =>
          item.id ===
          editingActivity.id
            ? {
                ...item,
                date: form.date,
                title:
                  form.title.trim(),
                type:
                  form.type.trim(),
                startTime:
                  form.startTime,
                endTime:
                  form.endTime,
                location:
                  form.location.trim(),
                capacity,
                note:
                  form.note.trim(),
              }
            : item
        )
      );
    } else {
      const newActivity: Activity =
        {
          id: Date.now(),
          date: form.date,
          title:
            form.title.trim(),
          type:
            form.type.trim(),
          startTime:
            form.startTime,
          endTime:
            form.endTime,
          location:
            form.location.trim(),
          capacity,
          note:
            form.note.trim(),
        };

      setActivities((prev) => [
        ...prev,
        newActivity,
      ]);
    }

    setOpenModal(false);
    setEditingActivity(null);
    setForm(emptyForm);
  };

  /*
   * 刪除活動
   */
  const handleDelete = (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "確定要刪除此活動嗎？"
      );

    if (!confirmed) return;

    setActivities((prev) =>
      prev.filter(
        (item) =>
          item.id !== id
      )
    );
  };

  /*
   * 關閉 Modal
   */
  const handleClose = () => {
    setOpenModal(false);
    setEditingActivity(null);
    setForm(emptyForm);
  };

  /*
   * 日期格式
   */
  const formatDate = (
    date: string
  ) => {
    if (!date) return "-";

    const parts =
      date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  return (
    <div
      style={{
        background:
          colors.background,
        borderRadius:
          radius.lg,
        boxShadow:
          shadow.md,
        padding: 24,
        display: "flex",
        flexDirection:
          "column",
        gap: 24,
      }}
    >
      {/* 標題 */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color:
                colors.primary,
            }}
          >
            活動管理
          </h2>

          <div
            style={{
              marginTop: 6,
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            共{" "}
            {activities.length}
            {" "}筆活動
          </div>
        </div>

        <button
          type="button"
          onClick={
            handleOpenAdd
          }
          style={{
            padding:
              "10px 18px",
            borderRadius:
              radius.md,
            border: "none",
            cursor: "pointer",
            background:
              colors.primary,
            color: "#fff",
            fontWeight: 600,
          }}
        >
          ＋ 新增活動
        </button>
      </div>

      {/* 活動列表 */}
      <div
        style={{
          background: "#fff",
          borderRadius:
            radius.lg,
          overflow: "hidden",
        }}
      >
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
                style={thStyle}
              >
                活動名稱
              </th>

              <th
                style={thStyle}
              >
                類型
              </th>

              <th
                style={thStyle}
              >
                日期
              </th>

              <th
                style={thStyle}
              >
                時間
              </th>

              <th
                style={thStyle}
              >
                地點
              </th>

              <th
                style={thStyle}
              >
                人數
              </th>

              <th
                style={thStyle}
              >
                操作
              </th>
            </tr>
          </thead>

          <tbody>
            {activities.length ===
            0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign:
                      "center",
                    padding: 40,
                    color:
                      colors.textLight,
                  }}
                >
                  尚無活動資料
                </td>
              </tr>
            ) : (
              activities.map(
                (activity) => {
                  const matchingCourse =
                    findMatchingCourse(
                      activity
                    );

                  return (
                    <tr
                      key={
                        activity.id
                      }
                    >
                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          activity.title
                        }
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {activity.type ||
                          "-"}
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {formatDate(
                          activity.date
                        )}
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          activity.startTime
                        }
                        {" ~ "}
                        {
                          activity.endTime
                        }
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          activity.location ||
                          "-"
                        }
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          activity.capacity
                        }
                        {" 人"}
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "center",
                            gap: 8,
                            flexWrap:
                              "wrap",
                          }}
                        >
                          {activity.type ===
                            "課程活動" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRegistration(
                                  activity
                                )
                              }
                              style={{
                                background:
                                  matchingCourse
                                    ? "#198754"
                                    : "#9CA3AF",
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
                                fontSize:
                                  13,
                              }}
                            >
                              報名管理
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEdit(
                                activity
                              )
                            }
                            style={{
                              background:
                                "#2563EB",
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
                              fontSize:
                                13,
                            }}
                          >
                            編輯
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                activity.id
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
                              fontSize:
                                13,
                            }}
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>

      {/* 新增 / 編輯 Modal */}
      {openModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.35)",
            display: "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: 560,
              maxWidth:
                "calc(100vw - 40px)",
              background: "#fff",
              borderRadius:
                radius.lg,
              boxShadow:
                shadow.lg,
              padding: 24,
              maxHeight:
                "90vh",
              overflowY:
                "auto",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom:
                  24,
                color:
                  colors.primary,
              }}
            >
              {editingActivity
                ? "編輯活動"
                : "新增活動"}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 16,
              }}
            >
              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  活動名稱
                </label>

                <input
                  type="text"
                  value={
                    form.title
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        title:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="例如：樂齡歡唱"
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
                  活動日期
                </label>

                <input
                  type="date"
                  value={
                    form.date
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        date:
                          e.target
                            .value,
                      })
                    )
                  }
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
                  活動類型
                </label>

                <select
                  value={
                    form.type
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        type:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={
                    inputStyle
                  }
                >
                  <option value="">
                    請選擇類型
                  </option>

                  <option value="課程活動">
                    課程活動
                  </option>

                  <option value="健康活動">
                    健康活動
                  </option>

                  <option value="節慶活動">
                    節慶活動
                  </option>

                  <option value="社區活動">
                    社區活動
                  </option>

                  <option value="其他">
                    其他
                  </option>
                </select>
              </div>

              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  開始時間
                </label>

                <input
                  type="time"
                  value={
                    form.startTime
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        startTime:
                          e.target
                            .value,
                      })
                    )
                  }
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
                  結束時間
                </label>

                <input
                  type="time"
                  value={
                    form.endTime
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        endTime:
                          e.target
                            .value,
                      })
                    )
                  }
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
                  活動地點
                </label>

                <input
                  type="text"
                  value={
                    form.location
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        location:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="例如：活動教室"
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
                  活動人數
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    form.capacity
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        capacity:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="例如：30"
                  style={
                    inputStyle
                  }
                />
              </div>

              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  備註
                </label>

                <textarea
                  value={
                    form.note
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        note:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="活動備註"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize:
                      "vertical",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: 12,
                marginTop: 24,
              }}
            >
              <button
                type="button"
                onClick={
                  handleClose
                }
                style={{
                  padding:
                    "10px 18px",
                  border:
                    "1px solid #D1D5DB",
                  background:
                    "#fff",
                  borderRadius:
                    radius.md,
                  cursor:
                    "pointer",
                }}
              >
                取消
              </button>

              <button
                type="button"
                onClick={
                  handleSave
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
                    "pointer",
                  fontWeight: 600,
                }}
              >
                {editingActivity
                  ? "儲存修改"
                  : "新增活動"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle:
  React.CSSProperties = {
  padding: "12px",
  textAlign: "center",
  borderBottom:
    "1px solid #E5E7EB",
  color: colors.primary,
  fontWeight: 600,
  fontSize: 14,
};

const tdStyle:
  React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "center",
  borderBottom:
    "1px solid #F3F4F6",
  fontSize: 14,
};

const labelStyle:
  React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  fontSize: 14,
};

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  padding: 10,
  border:
    "1px solid #D1D5DB",
  borderRadius: radius.md,
  boxSizing: "border-box",
  background: "#fff",
};