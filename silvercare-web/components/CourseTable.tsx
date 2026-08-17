"use client";

import { Course } from "./AddCourseModal";
import { colors } from "../styles/theme";
import { radius } from "../styles/radius";

type Props = {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (id: number) => void;
  onRegistration: (course: Course) => void;
};

function formatDate(date?: string) {
  if (!date) {
    return "-";
  }

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "-";
  }

  return `${d.getFullYear()}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/* 報名管理 Icon */
function RegistrationIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
      />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  );
}

/* 報名連結 Icon */
function LinkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/* 編輯 Icon */
function EditIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/* 刪除 Icon */
function DeleteIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

export default function CourseTable({
  courses,
  onEdit,
  onDelete,
  onRegistration,
}: Props) {
  const handleCopyRegistrationLink = (
    course: Course
  ) => {
    if (course.id === undefined) {
      alert("此課程沒有有效的課程 ID");
      return;
    }

    const link = `${window.location.origin}/course/register?courseId=${course.id}`;

    navigator.clipboard
      .writeText(link)
      .then(() => {
        alert(
          "報名連結已複製，可以貼到 LINE 群組。"
        );
      })
      .catch(() => {
        window.prompt(
          "請複製以下報名連結：",
          link
        );
      });
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: radius.lg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          paddingBottom: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            padding: "16px",
            color: colors.primary,
          }}
        >
          課程列表
        </h3>

        <div
          style={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 760,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#F7FAFC",
                }}
              >
                <th style={thStyle}>
                  課程
                </th>

                <th style={thStyle}>
                  老師
                </th>

                <th style={thStyle}>
                  日期
                </th>

                <th style={thStyle}>
                  時間
                </th>

                <th style={thStyle}>
                  容量
                </th>

                <th style={thStyle}>
                  教室
                </th>

                <th style={thStyle}>
                  操作
                </th>
              </tr>
            </thead>

            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={tdStyle}
                  >
                    尚無課程資料
                  </td>
                </tr>
              ) : (
                courses
                  .filter(
                    (course) =>
                      course.id !== undefined
                  )
                  .map((course) => (
                    <tr
                      key={course.id}
                    >
                      <td style={tdStyle}>
                        {course.title}
                      </td>

                      <td style={tdStyle}>
                        {course.teacher}
                      </td>

                      <td style={tdStyle}>
                        {formatDate(
                          course.date
                        )}
                      </td>

                      <td style={tdStyle}>
                        {course.startTime}
                        {" ~ "}
                        {course.endTime}
                      </td>

                      <td style={tdStyle}>
                        {course.capacity}
                        {" 人"}
                      </td>

                      <td style={tdStyle}>
                        {course.classroom ||
                          "-"}
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "center",
                            alignItems:
                              "center",
                            gap: 6,
                            flexWrap:
                              "nowrap",
                          }}
                        >
                          {/* 報名管理 */}
                          <button
                            type="button"
                            onClick={() =>
                              onRegistration(
                                course
                              )
                            }
                            title="報名管理"
                            aria-label="報名管理"
                            style={{
                              ...iconButtonStyle,
                              background:
                                "#198754",
                            }}
                          >
                            <RegistrationIcon />
                          </button>

                          {/* 報名連結 */}
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyRegistrationLink(
                                course
                              )
                            }
                            title="複製報名連結"
                            aria-label="複製報名連結"
                            style={{
                              ...iconButtonStyle,
                              background:
                                "#7C3AED",
                            }}
                          >
                            <LinkIcon />
                          </button>

                          {/* 編輯 */}
                          <button
                            type="button"
                            onClick={() =>
                              onEdit(course)
                            }
                            title="編輯課程"
                            aria-label="編輯課程"
                            style={{
                              ...iconButtonStyle,
                              background:
                                "#2563EB",
                            }}
                          >
                            <EditIcon />
                          </button>

                          {/* 刪除 */}
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                course.id !==
                                undefined
                              ) {
                                onDelete(
                                  course.id
                                );
                              }
                            }}
                            title="刪除課程"
                            aria-label="刪除課程"
                            style={{
                              ...iconButtonStyle,
                              background:
                                "#DC2626",
                            }}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  minWidth: 34,
  border: "none",
  borderRadius: radius.sm,
  color: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
};

const thStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "center",
  borderBottom:
    "1px solid #E5E7EB",
  color: colors.primary,
  fontWeight: 600,
  fontSize: 14,
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "center",
  borderBottom:
    "1px solid #F3F4F6",
  fontSize: 14,
};