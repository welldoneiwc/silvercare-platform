"use client";

import { Course } from "./AddCourseModal";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";

type Props = {
  courses: Course[];
  onEdit: (
    course: Course
  ) => void;
  onDelete: (
    id: number
  ) => void;
};


function formatDate(
  date?: string
) {
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


export default function CourseTable({
  courses,
  onEdit,
  onDelete,
}: Props) {

  return (
    <div
      style={{
        background: "#fff",
        borderRadius:
          radius.lg,
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
            color:
              colors.primary,
          }}
        >
          課程列表
        </h3>

      </div>


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
                  key={
                    course.id
                  }
                >

                  <td style={tdStyle}>
                    {course.title}
                  </td>


                  <td style={tdStyle}>
                    {course.teacher}
                  </td>


                  <td style={tdStyle}>
  {formatDate(course.date)}
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
                        display:
                          "flex",
                        justifyContent:
                          "center",
                        gap: 8,
                      }}
                    >

                      <button
                        onClick={() =>
                          onEdit(
                            course
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
                        onClick={() => {

  if (course.id !== undefined) {
    onDelete(course.id);
  }

}}
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

              )
            )

          )}

        </tbody>


      </table>

    </div>
  );
}



const thStyle: React.CSSProperties = {

  padding:
    "12px",

  textAlign:
    "center",

  borderBottom:
    "1px solid #E5E7EB",

  color:
    colors.primary,

  fontWeight:
    600,

  fontSize:
    14,

};



const tdStyle: React.CSSProperties = {

  padding:
    "14px 12px",

  textAlign:
    "center",

  borderBottom:
    "1px solid #F3F4F6",

  fontSize:
    14,

};