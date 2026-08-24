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

      return false;
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
   *
   * true  = 儲存成功
   * false = 儲存失敗
   */
  async function handleSave(
    course: Course
  ): Promise<boolean> {
    try {
      /*
       * ============================
       * 編輯既有課程
       * ============================
       */
      if (
        course.id !== undefined &&
        course.id !== null
      ) {
        const courseId =
          String(course.id);

        console.log(
          "================================"
        );

        console.log(
          "🟡 開始更新課程"
        );

        console.log(
          "🟡 Course ID:",
          courseId
        );

        console.log(
          "🟡 新課程名稱:",
          course.title
        );

        /*
         * 先確認目前 Supabase 裡
         * 真的有這個 ID。
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
            "找不到課程資料：\n" +
              findError.message
          );

          return false;
        }

        if (
          !existingCourse
        ) {
          console.error(
            "🔴 UPDATE 前找不到課程 ID：",
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
         * ============================
         * 真正 UPDATE
         * ============================
         */
        const {
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
          );

        console.log(
          "🔵 UPDATE 回應：",
          {
            updateError,
          }
        );

        if (updateError) {
          console.error(
            "🔴 UPDATE 失敗：",
            updateError
          );

          alert(
            "課程更新失敗：\n\n" +
              updateError.message
          );

          return false;
        }

        /*
         * ============================
         * UPDATE 後重新查詢
         * ============================
         */
        const {
          data: verifyCourse,
          error: verifyError,
        } = await supabase
          .from("courses")
          .select(
            "id,title,date,start_time,end_time,teacher,capacity,classroom,note"
          )
          .eq(
            "id",
            courseId
          )
          .maybeSingle();

        console.log(
          "🔵 UPDATE 後查詢：",
          {
            verifyCourse,
            verifyError,
          }
        );

        if (verifyError) {
          console.error(
            "🔴 UPDATE 後查詢失敗：",
            verifyError
          );

          alert(
            "課程更新後驗證失敗：\n\n" +
              verifyError.message
          );

          return false;
        }

        if (
          !verifyCourse
        ) {
          console.error(
            "🔴 UPDATE 後找不到課程：",
            courseId
          );

          alert(
            "課程更新後找不到資料。\n\n" +
              "ID：" +
              courseId
          );

          return false;
        }

        /*
         * ============================
         * 最重要：
         * 比對 Database 的名稱
         * ============================
         */
        console.log(
          "🟢 Database 更新後名稱：",
          verifyCourse.title
        );

        console.log(
          "🟢 使用者送出名稱：",
          course.title
        );

        if (
          verifyCourse.title !==
          course.title
        ) {
          console.error(
            "🔴 Database 名稱沒有變更"
          );

          alert(
            "課程更新沒有真正寫入。\n\n" +
              "送出：" +
              course.title +
              "\n" +
              "Database：" +
              verifyCourse.title
          );

          return false;
        }

        /*
         * ============================
         * 真正成功
         * ============================
         */
        console.log(
          "🟢🟢🟢 UPDATE 完全成功"
        );

        console.log(
          "更新後課程：",
          verifyCourse
        );

        /*
         * 重新讀取課程列表
         */
        const loadedSuccessfully =
          await loadCourses();

        if (
          !loadedSuccessfully
        ) {
          alert(
            "課程已更新，但重新讀取課程列表失敗。"
          );

          return false;
        }

        console.log(
          "🟢 課程列表重新載入成功"
        );

        console.log(
          "================================"
        );

        return true;
      }

      /*
       * ============================
       * 新增課程
       * ============================
       */
      const newId =
        Date.now();

      console.log(
        "🟡 開始新增課程：",
        {
          id: newId,
          title: course.title,
        }
      );

      const {
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
        });

      if (insertError) {
        console.error(
          "🔴 新增課程失敗：",
          insertError
        );

        alert(
          "新增課程失敗：\n\n" +
            insertError.message
        );

        return false;
      }

      console.log(
        "🟢 INSERT 成功：",
        newId
      );

      const loadedSuccessfully =
        await loadCourses();

      if (
        !loadedSuccessfully
      ) {
        alert(
          "課程新增成功，但重新讀取課程列表失敗。"
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "🔴 handleSave 發生例外：",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      alert(
        "儲存課程發生錯誤：\n\n" +
          message
      );

      return false;
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
        .eq(
          "id",
          String(id)
        );

      if (error) {
        console.error(
          "刪除課程失敗：",
          error
        );

        alert(
          "刪除課程失敗：\n" +
            error.message
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
        onSave={async (
          course
        ) => {
          /*
           * 只有 handleSave
           * 明確回傳 true
           * 才關閉 Modal。
           */
          const success =
            await handleSave(
              course
            );

          if (success) {
            setOpenModal(false);
            setEditingCourse(
              null
            );
          }
        }}
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

