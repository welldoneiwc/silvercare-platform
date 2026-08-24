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
   * ========================================
   * 從 Supabase 讀取課程
   * ========================================
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
          "讀取課程資料失敗：\n" +
            error.message
        );

        return false;
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

      return true;
    } catch (error) {
      console.error(
        "讀取課程發生錯誤：",
        error
      );

      alert(
        "讀取課程發生錯誤。"
      );

      return false;
    } finally {
      setLoaded(true);
    }
  }

  /*
   * ========================================
   * 第一次載入
   * ========================================
   */
  useEffect(() => {
    loadCourses();
  }, []);

  /*
   * ========================================
   * 新增 / 編輯課程
   * ========================================
   */
  async function handleSave(
    course: Course
  ): Promise<boolean> {
    try {
      /*
       * ====================================
       * 編輯既有課程
       * ====================================
       */
      if (
        course.id !== undefined &&
        course.id !== null
      ) {
        const courseId =
          course.id;

        console.log(
          "================================"
        );

        console.log(
          "🟡 開始 UPDATE 課程"
        );

        console.log(
          "🟡 Course ID:",
          courseId
        );

        console.log(
          "🟡 送出名稱:",
          course.title
        );

        /*
         * 先確認資料真的存在
         */
        const {
          data: existingCourse,
          error: findError,
        } = await supabase
          .from("courses")
          .select(
            "id,title"
          )
          .eq(
            "id",
            courseId
          )
          .maybeSingle();

        console.log(
          "🔵 UPDATE 前查詢：",
          {
            existingCourse,
            findError,
          }
        );

        if (findError) {
          console.error(
            "🔴 UPDATE 前查詢失敗：",
            findError
          );

          alert(
            "UPDATE 前查詢失敗：\n\n" +
              findError.message
          );

          return false;
        }

        if (!existingCourse) {
          console.error(
            "🔴 找不到課程 ID：",
            courseId
          );

          alert(
            "找不到對應的課程資料。\n\n" +
              "ID：" +
              courseId
          );

          return false;
        }

        console.log(
          "🟢 找到原始課程：",
          existingCourse
        );

        /*
         * ====================================
         * 真正 UPDATE
         *
         * 重點：
         * UPDATE 後直接 .select("*")
         *
         * 這樣可以知道：
         * 1. 有沒有真的更新
         * 2. Database 最後存的是什麼
         * ====================================
         */
        const {
          data: updatedCourses,
          error: updateError,
        } = await supabase
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
            courseId
          )
          .select("*");

        console.log(
          "🔵 UPDATE 回應：",
          {
            updatedCourses,
            updateError,
          }
        );

        /*
         * UPDATE API 本身發生錯誤
         */
        if (updateError) {
          console.error(
            "🔴 UPDATE API 失敗：",
            updateError
          );

          alert(
            "課程 UPDATE 失敗：\n\n" +
              updateError.message
          );

          return false;
        }

        /*
         * UPDATE 沒有回傳任何資料
         *
         * 這個情況非常重要：
         * 通常代表 UPDATE 實際上沒有更新到資料列。
         */
        if (
          !updatedCourses ||
          updatedCourses.length === 0
        ) {
          console.error(
            "🔴 UPDATE 0 筆資料"
          );

          alert(
            "課程更新失敗：\n\n" +
              "UPDATE 沒有真正寫入資料庫。\n\n" +
              "課程 ID：" +
              courseId
          );

          return false;
        }

        /*
         * UPDATE 成功
         */
        const updatedCourse =
          updatedCourses[0];

        console.log(
          "🟢 UPDATE 真正寫入成功：",
          updatedCourse
        );

        /*
         * ====================================
         * 確認 Database 最後的名稱
         * ====================================
         */
        console.log(
          "🟢 Database 名稱：",
          updatedCourse.title
        );

        console.log(
          "🟢 使用者送出名稱：",
          course.title
        );

        if (
          updatedCourse.title !==
          course.title
        ) {
          console.error(
            "🔴 UPDATE 後名稱不一致"
          );

          alert(
            "課程更新後資料不一致。\n\n" +
              "送出：" +
              course.title +
              "\n" +
              "Database：" +
              updatedCourse.title
          );

          return false;
        }

        /*
         * ====================================
         * 更新畫面
         * 不需要重新依賴舊 state
         * ====================================
         */
        const formattedCourse: Course = {
          id:
            updatedCourse.id,
          date:
            updatedCourse.date ??
            "",
          title:
            updatedCourse.title ??
            "",
          teacher:
            updatedCourse.teacher ??
            "",
          startTime:
            updatedCourse.start_time ??
            "",
          endTime:
            updatedCourse.end_time ??
            "",
          capacity:
            Number(
              updatedCourse.capacity ??
                0
            ),
          classroom:
            updatedCourse.classroom ??
            "",
          note:
            updatedCourse.note ??
            "",
        };

        setCourses(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                courseId
                  ? formattedCourse
                  : item
            )
        );

        /*
         * 如果目前報名管理正在看這門課，
         * 同步更新名稱
         */
        setRegistrationCourse(
          (prev) => {
            if (
              prev?.id ===
              courseId
            ) {
              return formattedCourse;
            }

            return prev;
          }
        );

        /*
         * 關閉編輯視窗
         */
        setOpenModal(false);

        setEditingCourse(
          null
        );

        console.log(
          "🟢 課程 UPDATE 完整成功"
        );

        console.log(
          "================================"
        );

        return true;
      }

      /*
       * ====================================
       * 新增課程
       * ====================================
       */
      const newId =
        Date.now();

      console.log(
        "================================"
      );

      console.log(
        "🟡 開始 INSERT 課程"
      );

      console.log(
        "🟡 Course ID:",
        newId
      );

      console.log(
        "🟡 課程名稱:",
        course.title
      );

      const {
        data: insertedCourses,
        error: insertError,
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
        })
        .select("*");

      console.log(
        "🔵 INSERT 回應：",
        {
          insertedCourses,
          insertError,
        }
      );

      if (insertError) {
        console.error(
          "🔴 INSERT 失敗：",
          insertError
        );

        alert(
          "新增課程失敗：\n\n" +
            insertError.message
        );

        return false;
      }

      if (
        !insertedCourses ||
        insertedCourses.length === 0
      ) {
        console.error(
          "🔴 INSERT 0 筆資料"
        );

        alert(
          "新增課程失敗：\n\n" +
            "INSERT 沒有真正寫入資料庫。"
        );

        return false;
      }

      console.log(
        "🟢 INSERT 真正寫入成功：",
        insertedCourses[0]
      );

      /*
       * 新增成功後重新載入
       */
      await loadCourses();

      setOpenModal(false);

      setEditingCourse(
        null
      );

      console.log(
        "🟢 課程 INSERT 完整成功"
      );

      console.log(
        "================================"
      );

      return true;
    } catch (error) {
      console.error(
        "🔴 儲存課程發生例外：",
        error
      );

      alert(
        "儲存課程時發生錯誤。"
      );

      return false;
    }
  }

  /*
   * ========================================
   * 刪除課程
   * ========================================
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
        data: deletedCourses,
        error,
      } = await supabase
        .from("courses")
        .delete()
        .eq("id", id)
        .select("*");

      console.log(
        "🗑️ DELETE 回應：",
        {
          deletedCourses,
          error,
        }
      );

      if (error) {
        console.error(
          "刪除課程失敗：",
          error
        );

        alert(
          "刪除課程失敗：\n\n" +
            error.message
        );

        return;
      }

      if (
        !deletedCourses ||
        deletedCourses.length === 0
      ) {
        alert(
          "刪除失敗：沒有真正刪除資料。"
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
        "刪除課程時發生錯誤。"
      );
    }
  }

  /*
   * ========================================
   * 開啟報名管理
   * ========================================
   */
  function handleRegistration(
    course: Course
  ) {
    setRegistrationCourse(
      course
    );
  }

  /*
   * ========================================
   * 關閉報名管理
   * ========================================
   */
  function handleCloseRegistration() {
    setRegistrationCourse(
      null
    );
  }

  /*
   * ========================================
   * 載入中
   * ========================================
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

  /*
   * ========================================
   * 畫面
   * ========================================
   */
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