"use client";

import {
  useEffect,
  useRef,
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
  ) => Promise<void>;
};

function getTodayDate() {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

  /*
   * 防止儲存按鈕快速連點。
   *
   * useRef 是同步鎖，
   * 比單純 useState 更能避免同一時間
   * 連續觸發兩次 onSave。
   */
  const savingRef =
    useRef(false);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    /*
     * 每次重新開啟 Modal 時，
     * 確保儲存鎖是解除的。
     */
    savingRef.current = false;
    setSaving(false);

    if (editingCourse) {
      setDate(
        editingCourse.date || ""
      );

      setTitle(
        editingCourse.title || ""
      );

      setTeacher(
        editingCourse.teacher || ""
      );

      setStartTime(
        editingCourse.startTime || ""
      );

      setEndTime(
        editingCourse.endTime || ""
      );

      setCapacity(
        editingCourse.capacity !==
          undefined
          ? editingCourse.capacity.toString()
          : "20"
      );

      setClassroom(
        editingCourse.classroom || ""
      );

      setNote(
        editingCourse.note || ""
      );
    } else {
      setDate(
        getTodayDate()
      );

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

  async function handleSaveClick() {
    /*
     * 如果已經正在儲存，
     * 直接忽略後續點擊。
     */
    if (savingRef.current) {
      return;
    }

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

    if (
      startTime >=
      endTime
    ) {
      alert(
        "結束時間必須晚於開始時間"
      );
      return;
    }

    const numericCapacity =
      Number(capacity);

    if (
      !Number.isFinite(
        numericCapacity
      ) ||
      numericCapacity <= 0
    ) {
      alert(
        "請輸入有效的人數上限"
      );
      return;
    }

    const course: Course =
      {
        ...(editingCourse?.id !==
        undefined
          ? {
              id:
                editingCourse.id,
            }
          : {}),

        date,

        title:
          title.trim(),

        teacher:
          teacher.trim(),

        startTime,

        endTime,

        capacity:
          numericCapacity,

        classroom:
          classroom.trim(),

        note:
          note.trim(),
      };

    /*
     * 立即鎖定。
     *
     * 注意：
     * 這裡先設定 useRef，
     * 再呼叫 onSave。
     * 即使使用者非常快速連點，
     * 第二次也會被擋掉。
     */
    savingRef.current = true;
    setSaving(true);

    try {
      /*
       * CourseSection.handleSave
       * 成功或失敗都由它自己處理。
       *
       * 這裡只等待它完成。
       */
      await onSave(course);
    } catch (error) {
      console.error(
        "課程儲存失敗：",
        error
      );

      alert(
        "課程儲存失敗，請查看主控台錯誤訊息。"
      );
    } finally {
      /*
       * 不論成功或失敗，
       * 都解除儲存鎖。
       */
      savingRef.current = false;
      setSaving(false);
    }
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
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius:
            radius.lg,
          boxShadow:
            shadow.lg,
          padding: 24,
          boxSizing: "border-box",
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
          {/* 課程日期 */}
          <div>
            <label>
              課程日期
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(
                  e.target.value
                )
              }
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          {/* 課程名稱 */}
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
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          {/* 授課老師 */}
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
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          {/* 開始時間 */}
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
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          {/* 結束時間 */}
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
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          {/* 人數上限 */}
          <div>
            <label>
              人數上限
            </label>

            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) =>
                setCapacity(
                  e.target.value
                )
              }
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          {/* 教室 */}
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
              disabled={saving}
              placeholder="例如：A教室"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border:
                  "1px solid #ddd",
                borderRadius:
                  radius.md,
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          {/* 備註 */}
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
              disabled={saving}
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
                boxSizing:
                  "border-box",
              }}
            />
          </div>
        </div>

        {/* 按鈕 */}
        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 12,
            marginTop: 24,
          }}
        >
          {/* 取消 */}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
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
                saving
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            取消
          </button>

          {/* 儲存 */}
          <button
            type="button"
            onClick={
              handleSaveClick
            }
            disabled={saving}
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
                saving
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 600,
              opacity:
                saving ? 0.7 : 1,
            }}
          >
            {saving
              ? "儲存中..."
              : editingCourse
              ? "儲存修改"
              : "新增課程"}
          </button>
        </div>
      </div>
    </div>
  );
}