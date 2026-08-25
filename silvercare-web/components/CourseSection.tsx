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
  async function loadCourses(): Promise<boolean> {
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

      console.log(
        "🟢 Supabase 課程資料：",
        formattedCourses
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
   *
   * 注意：
   * 這裡一定是 Promise<void>
   * 因為 AddCourseModal 的 onSave
   * 定義就是 Promise<void>
   * ========================================
   */
  async function handleSave(
    course: Course
  ): Promise<void> {
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
          "🟡 送出課程名稱:",
          course.title
        );

        /*
         * --------------------------------
         * ① 先確認這個 ID 存在
         * --------------------------------
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

          return;
        }

        if (
          !existingCourse
        ) {
          console.error(
            "🔴 找不到課程 ID：",
            courseId
          );

          alert(
            "找不到對應的課程資料。\n\n" +
              "ID：" +
              courseId
          );

          return;
        }

        console.log(
          "🟢 找到原始課程：",
          existingCourse
        );

        /*
         * --------------------------------
         * ② 真正 UPDATE
         *
         * 最重要的修改：
         *
         * .update(...)
         * .eq(...)
         * .select(...)
         *
         * 直接要求 Supabase 把「真正更新
         * 成功的資料列」回傳。
         * --------------------------------
         */
        const {
          data: updatedCourse,
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
          .select(
            "id,title,date,start_time,end_time,teacher,capacity,classroom,note"
          )
          .maybeSingle();

        console.log(
          "================================"
        );

        console.log(
          "🔵 UPDATE 回應：",
          {
            updatedCourse,
            updateError,
          }
        );

        /*
         * --------------------------------
         * ③ Supabase 回傳錯誤
         * --------------------------------
         */
        if (updateError) {
          console.error(
            "🔴 UPDATE 失敗：",
            updateError
          );

          alert(
            "課程更新失敗：\n\n" +
              updateError.message
          );

          return;
        }

        /*
         * --------------------------------
         * ④ 沒有任何資料列被 UPDATE
         *
         * 這是這次要抓的重點。
         * --------------------------------
         */
        if (
          !updatedCourse
        ) {
          console.error(
            "🔴 UPDATE 沒有真正更新任何資料列"
          );

          console.error(
            "🔴 使用的 Course ID：",
            courseId
          );

          console.error(
            "🔴 原本資料：",
            existingCourse
          );

          console.error(
            "🔴 送出資料：",
            course
          );

          alert(
            "課程更新沒有真正寫入 Database。\n\n" +
              "Course ID：" +
              courseId +
              "\n\n" +
              "請確認 Supabase courses 的 UPDATE 權限。"
          );

          return;
        }

        /*
         * --------------------------------
         * ⑤ Database 實際回傳的資料
         * --------------------------------
         */
        console.log(
          "🟢 Database 實際更新後資料：",
          updatedCourse
        );

        console.log(
          "🟢 送出名稱：",
          course.title
        );

        console.log(
          "🟢 Database 名稱：",
          updatedCourse.title
        );

        /*
         * --------------------------------
         * ⑥ 最後確認 title
         * --------------------------------
         */
        if (
          updatedCourse.title !==
          course.title
        ) {
          console.error(
            "🔴 UPDATE 後 title 不一致"
          );

          alert(
            "課程更新沒有真正寫入。\n\n" +
              "送出：" +
              course.title +
              "\n" +
              "Database：" +
              updatedCourse.title
          );

          return;
        }

        /*
         * --------------------------------
         * ⑦ 更新成功
         * --------------------------------
         */
        console.log(
          "🟢🟢🟢 課程 UPDATE 完全成功",
          updatedCourse
        );

        /*
         * 重新讀取整份課程列表
         */
        await loadCourses();

        /*
         * 如果目前報名管理的是同一門課，
         * 同步更新它
         */
        if (
          registrationCourse?.id ===
          courseId
        ) {
          setRegistrationCourse(
            {
              ...course,
              id: courseId,
            }
          );
        }

        /*
         * 關閉編輯視窗
         */
        setOpenModal(false);

        setEditingCourse(null);

        alert(
          "課程更新成功！\n\n" +
            "Database 已寫入：\n" +
            course.title
        );

        return;
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
        "🟡 New Course ID:",
        newId
      );

      console.log(
        "🟡 課程名稱:",
        course.title
      );

      /*
       * --------------------------------
       * INSERT
       * --------------------------------
       */
      const {
        data: insertedCourse,
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
        .select(
          "id,title,date,start_time,end_time,teacher,capacity,classroom,note"
        )
        .maybeSingle();

      console.log(
        "🔵 INSERT 回應：",
        {
          insertedCourse,
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

        return;
      }

      /*
       * --------------------------------
       * 確認 INSERT 真的產生資料
       * --------------------------------
       */
      if (
        !insertedCourse
      ) {
        console.error(
          "🔴 INSERT 沒有回傳資料"
        );

        alert(
          "新增課程沒有真正寫入 Database。"
        );

        return;
      }

      console.log(
        "🟢 INSERT 成功：",
        insertedCourse
      );

      /*
       * --------------------------------
       * 重新讀取
       * --------------------------------
       */
      await loadCourses();

      /*
       * 關閉 Modal
       */
      setOpenModal(false);

      setEditingCourse(null);

      alert(
        "課程新增成功！\n\n" +
          "Database 已寫入：\n" +
          insertedCourse.title
      );
    } catch (error) {
      console.error(
        "🔴 儲存課程發生例外：",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      alert(
        "儲存課程時發生錯誤：\n\n" +
          message
      );
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
        data: deletedCourse,
        error,
      } = await supabase
        .from("courses")
        .delete()
        .eq(
          "id",
          id
        )
        .select("id,title")
        .maybeSingle();

      console.log(
        "🗑️ DELETE 回應：",
        {
          deletedCourse,
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

      if (!deletedCourse) {
        alert(
          "刪除失敗：\n\n" +
            "Database 沒有刪除任何資料。"
        );

        return;
      }

      /*
       * 更新畫面
       */
      setCourses(
        (prev) =>
          prev.filter(
            (course) =>
              course.id !== id
          )
      );

      /*
       * 如果正在看這門課的報名管理，
       * 一併關閉
       */
      if (
        registrationCourse?.id ===
        id
      ) {
        setRegistrationCourse(
          null
        );
      }

      console.log(
        "🟢 DELETE 成功：",
        deletedCourse
      );
    } catch (error) {
      console.error(
        "刪除課程發生錯誤：",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      alert(
        "刪除課程時發生錯誤：\n\n" +
          message
      );
    }
  }

  /*
   * ========================================
   * 開啟課程報名管理
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
   * 關閉課程報名管理
   * ========================================
   */
  function handleCloseRegistration() {
    setRegistrationCourse(
      null
    );
  }

  /*
   * ========================================
   * 第一次載入尚未完成
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
   * 主畫面
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