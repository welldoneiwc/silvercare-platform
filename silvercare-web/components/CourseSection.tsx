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

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

const STORAGE_KEY =
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
   * 讀取 LocalStorage
   * 防止 F5 後被空陣列覆蓋
   */
  useEffect(() => {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (saved) {
      try {
        const parsed =
          JSON.parse(saved);

        if (
          Array.isArray(parsed)
        ) {
          setCourses(parsed);
        }
      } catch (error) {
        console.error(
          "Course storage error:",
          error
        );

        setCourses([]);
      }
    }

    setLoaded(true);
  }, []);

  /*
   * 寫入 LocalStorage
   * 等第一次讀取完成後才執行
   */
  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(courses)
    );
  }, [courses, loaded]);

  /*
   * 新增 / 編輯課程
   */
  function handleSave(
    course: Course
  ) {
    const newCourse: Course = {
      ...course,

      id:
        course.id ||
        Date.now(),
    };

    setCourses(
      (prev) => {
        const exists =
          prev.some(
            (item) =>
              item.id ===
              newCourse.id
          );

        if (exists) {
          return prev.map(
            (item) =>
              item.id ===
              newCourse.id
                ? newCourse
                : item
          );
        }

        return [
          ...prev,
          newCourse,
        ];
      }
    );

    setOpenModal(false);
    setEditingCourse(null);
  }

  /*
   * 刪除課程
   */
  function handleDelete(
    id: number
  ) {
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
  course={registrationCourse}
/>
        </div>
      )}
    </div>
  );
}