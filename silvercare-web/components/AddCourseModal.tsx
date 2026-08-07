"use client";

import {
  useEffect,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

export type Course = {
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

type Props = {
  open: boolean;
  editingCourse: Course | null;
  onClose: () => void;
  onSave: (
  course: Course
) => void;
};

function getTodayDate() {
  return new Date()
    .toISOString();
}

export default function AddCourseModal({
  open,
  editingCourse,
  onClose,
  onSave,
}: Props) {

  const [date, setDate] =
useState("");

  const [title, setTitle] =
    useState("");

  const [teacher, setTeacher] =
    useState("");

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [capacity, setCapacity] =
    useState("");

  const [classroom, setClassroom] =
    useState("");

  const [note, setNote] =
    useState("");

  useEffect(() => {

    if (!open) return;

    setDate(
  editingCourse?.date || ""
);

    if (editingCourse) {

      setTitle(
        editingCourse.title
      );

      setTeacher(
        editingCourse.teacher
      );

      setStartTime(
        editingCourse.startTime
      );

      setEndTime(
        editingCourse.endTime
      );

      setCapacity(
        editingCourse.capacity.toString()
      );

      setClassroom(
        editingCourse.classroom
      );

      setNote(
        editingCourse.note
      );

    } else {

      setTitle("");

      setTeacher("");

      setStartTime(
        "09:00"
      );

      setEndTime(
        "10:00"
      );

      setCapacity(
        "20"
      );

      setClassroom("");

      setNote("");
    }

  }, [
    open,
    editingCourse,
  ]);


  if (!open) {
    return null;
  }


  return (
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
          background: "#fff",
          borderRadius:
            radius.lg,
          boxShadow:
            shadow.lg,
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
          {editingCourse
            ? "編輯課程"
            : "新增課程"}
        </h2>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: 16,
          }}
        >

          <div>
            <label>
              課程名稱
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>


          <div>
            <label>
              授課老師
            </label>

            <input
              value={teacher}
              onChange={(e) =>
                setTeacher(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>


          <div>
            <label>
              開始時間
            </label>

            <input
              type="time"
              value={startTime}
              onChange={(e) =>
                setStartTime(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>


          <div>
            <label>
              結束時間
            </label>

            <input
              type="time"
              value={endTime}
              onChange={(e) =>
                setEndTime(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>
                    <div>
            <label>
              人數上限
            </label>

            <input
              type="number"
              value={capacity}
              onChange={(e) =>
                setCapacity(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>


          <div>
            <label>
              教室
            </label>

            <input
              value={classroom}
              onChange={(e) =>
                setClassroom(
                  e.target.value
                )
              }
              placeholder="例如：A教室"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
              }}
            />
          </div>


          <div
            style={{
              gridColumn:
                "1 / span 2",
            }}
          >
            <label>
              備註
            </label>

            <textarea
              value={note}
              onChange={(e) =>
                setNote(
                  e.target.value
                )
              }
              rows={4}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
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
            onClick={onClose}
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
            onClick={() => {

              if (!date) {
  alert(
    "請選擇課程日期"
  );
  return;
}
              if (!title.trim()) {
                alert(
                  "請輸入課程名稱"
                );
                return;
              }


              if (!teacher.trim()) {
                alert(
                  "請輸入授課老師"
                );
                return;
              }


              if (
                !startTime ||
                !endTime
              ) {
                alert(
                  "請選擇課程時間"
                );
                return;
              }


              onSave({

  date,

  title,

  teacher,

  startTime,

  endTime,

  capacity:
    Number(
      capacity
    ) || 0,

  classroom,

  note,

});

setDate("");
              setTitle("");

              setTeacher("");

              setStartTime(
                "09:00"
              );

              setEndTime(
                "10:00"
              );

              setCapacity(
                "20"
              );

              setClassroom("");

              setNote("");

            }}
            style={{
              background:
                colors.primary,
              color:
                "#fff",
              border:
                "none",
              borderRadius:
                radius.md,
              padding:
                "10px 20px",
              cursor:
                "pointer",
              fontWeight:
                600,
            }}
          >
            {editingCourse
              ? "儲存修改"
              : "新增課程"}
          </button>

        </div>

      </div>

    </div>
  );
}