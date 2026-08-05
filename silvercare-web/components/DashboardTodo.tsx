"use client";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

type Props = {
  elderCount: number;
  todayHealthCount: number;
  todayAttendanceCount: number;
  todayCourseCount: number;
};

type TodoItem = {
  title: string;
  done: boolean;
};

export default function DashboardTodo({
  elderCount,
  todayHealthCount,
  todayAttendanceCount,
  todayCourseCount,
}: Props) {
  const todos: TodoItem[] = [
    {
      title: "建立長者資料",
      done: elderCount > 0,
    },
    {
      title: "今日健康量測",
      done: todayHealthCount > 0,
    },
    {
      title: "今日簽到",
      done: todayAttendanceCount > 0,
    },
    {
      title: "今日課程",
      done: todayCourseCount > 0,
    },
  ];

  const completed =
    todos.filter(
      (item) => item.done
    ).length;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: radius.lg,
        boxShadow: shadow.md,
        padding: 24,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 20,
          color: colors.primary,
        }}
      >
        今日待辦
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {todos.map((todo) => (
          <div
            key={todo.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: radius.md,
              background: todo.done
                ? "#ECFDF5"
                : "#F9FAFB",
              border: `1px solid ${
                todo.done
                  ? "#BBF7D0"
                  : "#E5E7EB"
              }`,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: todo.done
                  ? "#16A34A"
                  : "#D1D5DB",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {todo.done ? "✓" : ""}
            </div>

            <div
              style={{
                flex: 1,
                color: colors.text,
                fontWeight: 500,
              }}
            >
              {todo.title}
            </div>
                        <div
              style={{
                fontSize: 13,
                color: todo.done
                  ? "#16A34A"
                  : colors.textLight,
                fontWeight: 600,
              }}
            >
              {todo.done
                ? "已完成"
                : "待完成"}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop:
            "1px solid #E5E7EB",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: colors.textLight,
            }}
          >
            今日完成進度
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 28,
              fontWeight: 700,
              color: colors.primary,
            }}
          >
            {completed} / {todos.length}
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: colors.textLight,
            }}
          >
            完成率
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 28,
              fontWeight: 700,
              color:
                completed ===
                todos.length
                  ? "#16A34A"
                  : "#EA580C",
            }}
          >
            {Math.round(
              (completed /
                todos.length) *
                100
            )}
            %
          </div>
        </div>
      </div>
    </div>
  );
}