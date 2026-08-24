"use client";

import {
  useEffect,
  useState,
} from "react";

import AddCourseModal, {
  Course,
} from "./AddCourseModal";

import CourseTable from "./CourseTable";

import CourseRegistration from "./CourseRegistration";

import { supabase } from "../utils/supabase";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

export default function CourseSection() {
  const [courses, setCourses] =
    useState<Course[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [openModal, setOpenModal] =
    useState(false);

  const [
    editingCourse,
    setEditingCourse,
  ] = useState<Course | null>(null);

  const [
    registrationCourse,
    setRegistrationCourse,
  ] = useState<Course | null>(null);

  /*
   * 從 Supabase 讀取課程
   */
  async function loadCourses() {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("courses")
        .select("*")
        .order("date", {
          ascending: true,
        })
        .order("start_time", {
          ascending: true,
        });

      if (error) {
        console.error(
          "讀取課程失敗：",
          error
        );

        alert(
          "讀取課程資料失敗，請稍後再試。"
        );

        return;
      }

      const formattedCourses: Course[] =
        (data ?? []).map(
          (item) => ({
            id: item.id,
            date: item.date ?? "",
            title: item.title ?? "",
            teacher:
              item.teacher ?? "",
            startTime:
              item.start_time ?? "",
            endTime:
              item.end_time ?? "",
            capacity:
              Number(
                item.capacity ?? 0
              ),
            classroom:
              item.classroom ?? "",
            note: item.note ?? "",
          })
        );

      setCourses(
        formattedCourses
      );
    } catch (error) {
      console.error(
        "讀取課程發生錯誤：",
        error
      );
    } finally {
      setLoaded(true);
    }
  }

  /*
   * 第一次載入
   */
  useEffect(() => {
    loadCourses();
  }, []);

  /*
   * 新增 / 編輯課程
   */
  async function handleSave(
    course: Course
  ) {
    try {
      /*
       * 編輯既有課程
       */
      if (
        course.id !== undefined
      ) {
        console.log(
          "🟢 準備 UPDATE 課程：",
          {
            courseId: course.id,
            title: course.title,
          }
        );

        const { error } =
          await supabase
            .from("courses")
            .update({
              date: course.date,
              title: course.title,
              teacher:
                course.teacher,
              start_time:
                course.startTime,
              end_time:
                course.endTime,
              capacity:
                course.capacity,
              classroom:
                course.classroom,
              note: course.note,
            })
            .eq(
              "id",
              course.id
            );

        if (error) {
          console.error(
            "更新課程失敗：",
            error
          );

          alert(
            "更新課程失敗，請稍後再試。"
          );

          return;
        }

        console.log(
          "🟢 課程 UPDATE 成功：",
          course.id
        );
      } else {
        /*
         * 新增課程
         *
         * ID 暫時使用前端 Date.now()
         */
        const newId =
          Date.now();

        console.log(
          "🟢 準備 INSERT 課程：",
          {
            courseId: newId,
            title: course.title,
          }
        );

        const {
          error,
        } = await supabase
          .from("courses")
          .insert({
            id: newId,
            date: course.date,
            title: course.title,
            teacher:
              course.teacher,
            start_time:
              course.startTime,
            end_time:
              course.endTime,
            capacity:
              course.capacity,
            classroom:
              course.classroom,
            note: course.note,
          });

        if (error) {
          console.error(
            "新增課程失敗：",
            error
          );

          alert(
            "新增課程失敗，請稍後再試。"
          );

          return;
        }

        console.log(
          "🟢 課程 INSERT 成功：",
          newId
        );
      }

      /*
       * 儲存成功後重新讀取
       * 確保畫面與 Database 一致
       */
      await loadCourses();

      setOpenModal(false);
      setEditingCourse(null);
    } catch (error) {
      console.error(
        "儲存課程發生錯誤：",
        error
      );

      alert(
        "儲存課程時發生錯誤，請稍後再試。"
      );
    }
  }

  /*
   * 刪除課程
   */
  async function handleDelete(
    id: number
  ) {
    const confirmed =
      window.confirm(
        "確定要刪除這門課程嗎？"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error,
      } = await supabase
        .from("courses")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "刪除課程失敗：",
          error
        );

        alert(
          "刪除課程失敗，請稍後再試。"
        );

        return;
      }

      setCourses(
        (prev) =>
          prev.filter(
            (course) =>
              course.id !== id
          )
      );

      if (
        registrationCourse?.id ===
        id
      ) {
        setRegistrationCourse(
          null
        );
      }
    } catch (error) {
      console.error(
        "刪除課程發生錯誤：",
        error
      );

      alert(
        "刪除課程時發生錯誤，請稍後再試。"
      );
    }
  }

  /*
   * 開啟課程報名管理
   */
  function handleRegistration(
    course: Course
  ) {
    setRegistrationCourse(
      course
    );
  }

  /*
   * 關閉課程報名管理
   */
  function handleCloseRegistration() {
    setRegistrationCourse(
      null
    );
  }

  /*
   * 第一次載入尚未完成
   */
  if (!loaded) {
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
          textAlign: "center",
          color: "#6B7280",
        }}
      >
        課程資料載入中...
      </div>
    );
  }

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
      {/* 課程管理標題 */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            color:
              colors.primary,
          }}
        >
          課程管理
        </h2>

        <button
          type="button"
          onClick={() => {
            setEditingCourse(
              null
            );

            setOpenModal(true);
          }}
          style={{
            padding:
              "10px 18px",
            borderRadius:
              radius.md,
            border:
              "none",
            cursor:
              "pointer",
            background:
              colors.primary,
            color:
              "#fff",
          }}
        >
          新增課程
        </button>
      </div>

      {/* 課程列表 */}
      <CourseTable
        courses={courses}
        onEdit={(course) => {
          setEditingCourse(
            course
          );

          setOpenModal(true);
        }}
        onDelete={
          handleDelete
        }
        onRegistration={
          handleRegistration
        }
      />

      {/* 新增 / 編輯課程 Modal */}
      <AddCourseModal
        open={openModal}
        editingCourse={
          editingCourse
        }
        onClose={() => {
          setOpenModal(false);
          setEditingCourse(
            null
          );
        }}
        onSave={
          handleSave
        }
      />

      {/* 報名管理 */}
      {registrationCourse && (
        <div
          style={{
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom: 12,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color:
                    colors.primary,
                }}
              >
                報名管理
              </h3>

              <div
                style={{
                  marginTop: 6,
                  color:
                    "#6B7280",
                  fontSize: 14,
                }}
              >
                目前課程：
                {
                  registrationCourse.title
                }
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleCloseRegistration
              }
              style={{
                padding:
                  "8px 16px",
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
              關閉報名管理
            </button>
          </div>

          <CourseRegistration
            course={
              registrationCourse
            }
          />
        </div>
      )}
    </div>
  );
}