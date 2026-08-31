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

const COURSE_STORAGE_KEY =
  "silvercare-courses";

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
   *
   * 如果舊手機還有 LocalStorage 課程，
   * 會先把 Supabase 沒有的舊課程補上雲端。
   * ========================================
   */
  async function loadCourses(): Promise<boolean> {
    try {
      /*
       * ------------------------------------
       * ① 先讀取 Supabase
       * ------------------------------------
       */
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

      /*
       * ------------------------------------
       * ② 讀取舊 LocalStorage 課程
       *
       * 用來把之前手機建立、但尚未進
       * Supabase 的課程補進雲端。
       * ------------------------------------
       */
      let legacyCourses: Course[] = [];

      try {
        const savedCourses =
          localStorage.getItem(
            COURSE_STORAGE_KEY
          );

        if (savedCourses) {
          const parsed =
            JSON.parse(
              savedCourses
            );

          if (
            Array.isArray(parsed)
          ) {
            legacyCourses =
              parsed.filter(
                (course) =>
                  course &&
                  course.id !==
                    undefined &&
                  course.id !==
                    null
              );
          }
        }
      } catch (localError) {
        console.error(
          "讀取舊課程 LocalStorage 失敗：",
          localError
        );
      }

      /*
       * ------------------------------------
       * ③ 找出 Supabase 已存在的 ID
       * ------------------------------------
       */
      const existingIds =
        new Set(
          (data ?? []).map(
            (course) =>
              String(course.id)
          )
        );

      /*
       * ------------------------------------
       * ④ 找出只存在手機 LocalStorage、
       *    但 Supabase 還沒有的課程
       * ------------------------------------
       */
      const coursesToMigrate =
        legacyCourses.filter(
          (course) =>
            !existingIds.has(
              String(course.id)
            )
        );

      /*
       * ------------------------------------
       * ⑤ 將舊課程補進 Supabase
       * ------------------------------------
       */
      if (
        coursesToMigrate.length >
        0
      ) {
        console.log(
          "🟡 發現尚未同步的舊課程：",
          coursesToMigrate
        );

        const rows =
          coursesToMigrate.map(
            (course) => ({
              id: course.id,
              date:
                course.date ?? "",
              title:
                course.title ?? "",
              teacher:
                course.teacher ?? "",
              start_time:
                course.startTime ?? "",
              end_time:
                course.endTime ?? "",
              capacity:
                Number(
                  course.capacity ?? 0
                ),
              classroom:
                course.classroom ?? "",
              note:
                course.note ?? "",
            })
          );

        const {
          error: migrateError,
        } = await supabase
          .from("courses")
          .insert(rows);
if (migrateError) {
  console.error(
    "🔴 舊課程同步到 Supabase 失敗：",
    JSON.stringify(
      migrateError,
      null,
      2
    )
  );
}else {
          console.log(
            "🟢 舊課程已同步到 Supabase：",
            rows
          );
        }
      }

      /*
       * ------------------------------------
       * ⑥ 如果有遷移資料，重新從 Supabase
       *    讀一次，確保畫面使用雲端資料
       * ------------------------------------
       */
      let finalData =
        data ?? [];

      if (
        coursesToMigrate.length >
        0
      ) {
        const {
          data: refreshedData,
          error:
            refreshedError,
        } = await supabase
          .from("courses")
          .select("*")
          .order("date", {
            ascending: true,
          })
          .order("start_time", {
            ascending: true,
          });

        if (
          refreshedError
        ) {
          console.error(
            "重新讀取課程失敗：",
            refreshedError
          );
        } else {
          finalData =
            refreshedData ?? [];
        }
      }

      /*
       * ------------------------------------
       * ⑦ 統一轉成前端 Course 格式
       * ------------------------------------
       */
      const formattedCourses: Course[] =
        finalData.map(
          (item) => ({
            id: item.id,
            date:
              item.date ?? "",
            title:
              item.title ?? "",
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
            note:
              item.note ?? "",
          })
        );

      console.log(
        "🟢 Supabase 最終課程資料：",
        formattedCourses
      );

      setCourses(
        formattedCourses
      );

      /*
       * ------------------------------------
       * ⑧ 同步更新本機 LocalStorage
       *
       * 之後手機／電腦都以雲端資料為準。
       * ------------------------------------
       */
      try {
        localStorage.setItem(
          COURSE_STORAGE_KEY,
          JSON.stringify(
            formattedCourses
          )
        );
      } catch (localError) {
        console.error(
          "更新課程 LocalStorage 失敗：",
          localError
        );
      }

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
         * 先確認這個 ID 存在
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

        /*
         * 真正 UPDATE
         */
        const {
          data: updatedCourse,
          error: updateError,
        } = await supabase
          .from("courses")
          .update({
            date:
              course.date,
            title:
              course.title,
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
            note:
              course.note,
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
          "🔵 UPDATE 回應：",
          {
            updatedCourse,
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

          return;
        }

        if (
          !updatedCourse
        ) {
          console.error(
            "🔴 UPDATE 沒有真正更新任何資料列"
          );

          alert(
            "課程更新沒有真正寫入 Database。\n\n" +
              "Course ID：" +
              courseId
          );

          return;
        }

        console.log(
          "🟢 Database 實際更新後資料：",
          updatedCourse
        );

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
         * 重新讀取整份課程列表
         */
        await loadCourses();

        /*
         * 如果目前報名管理的是同一門課，
         * 同步更新
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

      const {
        data: insertedCourse,
        error: insertError,
      } = await supabase
        .from("courses")
        .insert({
          id: newId,
          date:
            course.date,
          title:
            course.title,
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
          note:
            course.note,
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
       * 重新讀取
       */
      await loadCourses();

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

      setCourses(
        (prev) =>
          prev.filter(
            (course) =>
              course.id !== id
          )
      );

      try {
        const savedCourses =
          localStorage.getItem(
            COURSE_STORAGE_KEY
          );

        if (savedCourses) {
          const parsed =
            JSON.parse(
              savedCourses
            );

          if (
            Array.isArray(parsed)
          ) {
            const updated =
              parsed.filter(
                (course) =>
                  course.id !== id
              );

            localStorage.setItem(
              COURSE_STORAGE_KEY,
              JSON.stringify(
                updated
              )
            );
          }
        }
      } catch (localError) {
        console.error(
          "刪除後更新 LocalStorage 失敗：",
          localError
        );
      }

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

