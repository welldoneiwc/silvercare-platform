"use client";

import {
  useEffect,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

import { supabase } from "../utils/supabase";

export type Activity = {
  id: number;
  date: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  note: string;
};

const emptyForm = {
  date: "",
  title: "",
  type: "",
  startTime: "",
  endTime: "",
  location: "",
  capacity: "",
  note: "",
};

export default function ActivitySection() {
  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [openModal, setOpenModal] =
    useState(false);

  const [
    editingActivity,
    setEditingActivity,
  ] = useState<Activity | null>(null);

  const [form, setForm] =
    useState(emptyForm);

  const [saving, setSaving] =
    useState(false);

  /*
   * ========================================
   * 讀取活動
   * ========================================
   */
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const { data, error } =
          await supabase
            .from("activities")
            .select(
              `
                id,
                date,
                title,
                type,
                start_time,
                end_time,
                location,
                capacity,
                note
              `
            )
            .order("date", {
              ascending: true,
            })
            .order("start_time", {
              ascending: true,
            });

        if (error) {
          throw error;
        }

        const mappedActivities: Activity[] =
          (data ?? []).map((item) => ({
            id: Number(item.id),
            date: item.date,
            title: item.title,
            type: item.type ?? "",
            startTime:
              item.start_time ?? "",
            endTime:
              item.end_time ?? "",
            location:
              item.location ?? "",
            capacity:
              Number(item.capacity ?? 0),
            note: item.note ?? "",
          }));

        setActivities(
          mappedActivities
        );
      } catch (error) {
        console.error(
          "讀取活動資料失敗：",
          error
        );

        setActivities([]);
      } finally {
        setLoaded(true);
      }
    };

    void loadActivities();
  }, []);

  /*
   * ========================================
   * 開啟新增
   * ========================================
   */
  const handleOpenAdd = () => {
    setEditingActivity(null);

    setForm({
      ...emptyForm,
      date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setOpenModal(true);
  };

  /*
   * ========================================
   * 開啟編輯
   * ========================================
   */
  const handleOpenEdit = (
    activity: Activity
  ) => {
    setEditingActivity(activity);

    setForm({
      date: activity.date,
      title: activity.title,
      type: activity.type,
      startTime:
        activity.startTime,
      endTime:
        activity.endTime,
      location:
        activity.location,
      capacity:
        String(activity.capacity),
      note: activity.note,
    });

    setOpenModal(true);
  };

  /*
   * ========================================
   * 分享活動
   * ========================================
   */
  const handleShare = async (
    activity: Activity
  ) => {
    try {
      const shareUrl =
        `${window.location.origin}/activity/share?id=${activity.id}`;

      await navigator.clipboard.writeText(
        shareUrl
      );

      alert(
        "活動連結已複製！\n\n可以直接貼到 LINE、WhatsApp 或其他群組。"
      );
    } catch (error) {
      console.error(
        "複製活動連結失敗：",
        error
      );

      window.prompt(
        "請複製以下活動連結：",
        `${window.location.origin}/activity/share?id=${activity.id}`
      );
    }
  };

  /*
   * ========================================
   * 儲存活動
   * ========================================
   */
  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("請輸入活動名稱");
      return;
    }

    if (!form.date) {
      alert("請選擇活動日期");
      return;
    }

    if (!form.startTime) {
      alert("請選擇開始時間");
      return;
    }

    if (!form.endTime) {
      alert("請選擇結束時間");
      return;
    }

    const capacity =
      Number(form.capacity);

    if (
      !form.capacity ||
      capacity <= 0
    ) {
      alert(
        "請輸入正確的活動人數"
      );
      return;
    }

    setSaving(true);

    try {
      const activityData = {
        date: form.date,
        title: form.title.trim(),
        type: form.type.trim(),
        start_time: form.startTime,
        end_time: form.endTime,
        location:
          form.location.trim(),
        capacity,
        note: form.note.trim(),
      };

      if (editingActivity) {
        const { data, error } =
          await supabase
            .from("activities")
            .update(activityData)
            .eq(
              "id",
              editingActivity.id
            )
            .select()
            .single();

        if (error) {
          throw error;
        }

        const updatedActivity: Activity =
          {
            id: Number(data.id),
            date: data.date,
            title: data.title,
            type: data.type ?? "",
            startTime:
              data.start_time ?? "",
            endTime:
              data.end_time ?? "",
            location:
              data.location ?? "",
            capacity:
              Number(
                data.capacity ?? 0
              ),
            note: data.note ?? "",
          };

        setActivities((prev) =>
          prev.map((item) =>
            item.id ===
            editingActivity.id
              ? updatedActivity
              : item
          )
        );
      } else {
        const { data, error } =
          await supabase
            .from("activities")
            .insert(activityData)
            .select()
            .single();

        if (error) {
          throw error;
        }

        const newActivity: Activity =
          {
            id: Number(data.id),
            date: data.date,
            title: data.title,
            type: data.type ?? "",
            startTime:
              data.start_time ?? "",
            endTime:
              data.end_time ?? "",
            location:
              data.location ?? "",
            capacity:
              Number(
                data.capacity ?? 0
              ),
            note: data.note ?? "",
          };

        setActivities((prev) => [
          ...prev,
          newActivity,
        ]);
      }

      setOpenModal(false);
      setEditingActivity(null);
      setForm(emptyForm);
    } catch (error) {
      console.error(
        "儲存活動失敗：",
        error
      );

      alert(
        "儲存活動失敗：" +
          (error instanceof Error
            ? error.message
            : String(error))
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ========================================
   * 刪除活動
   * ========================================
   */
  const handleDelete = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "確定要刪除此活動嗎？"
      );

    if (!confirmed) return;

    try {
      const {
        data,
        error,
      } = await supabase
        .from("activities")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) {
        throw error;
      }

      if (
        !data ||
        data.length === 0
      ) {
        throw new Error(
          "Database 沒有刪除任何資料"
        );
      }

      setActivities((prev) =>
        prev.filter(
          (item) =>
            item.id !== id
        )
      );

      alert("活動刪除成功！");
    } catch (error) {
      console.error(
        "刪除活動失敗：",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      alert(
        `刪除活動失敗：\n${message}`
      );
    }
  };

  /*
   * ========================================
   * 關閉 Modal
   * ========================================
   */
  const handleClose = () => {
    if (saving) return;

    setOpenModal(false);
    setEditingActivity(null);
    setForm(emptyForm);
  };

  /*
   * ========================================
   * 日期格式
   * ========================================
   */
  const formatDate = (
    date: string
  ) => {
    if (!date) return "-";

    const parts =
      date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  /*
   * ========================================
   * UI
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
      {/* 標題 */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color:
                colors.primary,
            }}
          >
            活動管理
          </h2>

          <div
            style={{
              marginTop: 6,
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            共 {activities.length} 筆活動
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            width: 46,
            height: 46,
            borderRadius:
              radius.md,
            border: "none",
            cursor: "pointer",
            background:
              colors.primary,
            color: "#fff",
            fontWeight: 700,
            fontSize: 26,
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            flexShrink: 0,
          }}
          aria-label="新增活動"
          title="新增活動"
        >
          +
        </button>
      </div>

      {/* 活動列表 */}
      <div
        style={{
          display: "flex",
          flexDirection:
            "column",
          gap: 14,
        }}
      >
        {activities.length ===
        0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius:
                radius.lg,
              padding: 40,
              textAlign:
                "center",
              color:
                colors.textLight,
            }}
          >
            尚無活動資料
          </div>
        ) : (
          activities.map(
            (activity) => (
              <div
                key={activity.id}
                style={{
                  background:
                    "#fff",
                  borderRadius:
                    radius.lg,
                  padding:
                    "20px 22px",
                  boxShadow:
                    "0 2px 10px rgba(0,0,0,0.05)",
                  border:
                    "1px solid #E5E7EB",
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 20,
                  flexWrap:
                    "wrap",
                }}
              >
                {/* 活動名稱 */}
                <div
                  style={{
                    flex:
                      "1 1 220px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color:
                        colors.primary,
                      marginBottom: 6,
                      overflowWrap:
                        "anywhere",
                    }}
                  >
                    {activity.title}
                  </div>

                  <div
                    style={{
                      color:
                        "#6B7280",
                      fontSize: 13,
                    }}
                  >
                    {activity.type ||
                      "一般活動"}
                  </div>
                </div>

                {/* 日期 */}
                <div
                  style={{
                    flex:
                      "0 1 130px",
                  }}
                >
                  <div
                    style={
                      infoLabelStyle
                    }
                  >
                    日期
                  </div>

                  <div
                    style={
                      infoValueStyle
                    }
                  >
                    {formatDate(
                      activity.date
                    )}
                  </div>
                </div>

                {/* 時間 */}
                <div
                  style={{
                    flex:
                      "0 1 150px",
                  }}
                >
                  <div
                    style={
                      infoLabelStyle
                    }
                  >
                    時間
                  </div>

                  <div
                    style={
                      infoValueStyle
                    }
                  >
                    {activity.startTime ||
                      "-"}
                    {" ~ "}
                    {activity.endTime ||
                      "-"}
                  </div>
                </div>

                {/* 地點 */}
                <div
                  style={{
                    flex:
                      "0 1 170px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={
                      infoLabelStyle
                    }
                  >
                    地點
                  </div>

                  <div
                    style={{
                      ...infoValueStyle,
                      overflowWrap:
                        "anywhere",
                    }}
                  >
                    {activity.location ||
                      "-"}
                  </div>
                </div>

                {/* 人數 */}
                <div
                  style={{
                    flex:
                      "0 1 80px",
                  }}
                >
                  <div
                    style={
                      infoLabelStyle
                    }
                  >
                    人數
                  </div>

                  <div
                    style={
                      infoValueStyle
                    }
                  >
                    {activity.capacity} 人
                  </div>
                </div>

                {/* 操作 icon */}
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: 8,
                    marginLeft:
                      "auto",
                  }}
                >
                  {/* 分享 */}
                  <button
                    type="button"
                    onClick={() =>
                      void handleShare(
                        activity
                      )
                    }
                    style={{
                      width: 42,
                      height: 42,
                      border: "none",
                      borderRadius:
                        10,
                      background:
                        "#0F766E",
                      color: "#fff",
                      cursor:
                        "pointer",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                    }}
                    aria-label="分享活動"
                    title="分享活動"
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle
                        cx="18"
                        cy="5"
                        r="3"
                      />
                      <circle
                        cx="6"
                        cy="12"
                        r="3"
                      />
                      <circle
                        cx="18"
                        cy="19"
                        r="3"
                      />
                      <line
                        x1="8.59"
                        y1="13.51"
                        x2="15.42"
                        y2="17.49"
                      />
                      <line
                        x1="15.41"
                        y1="6.51"
                        x2="8.59"
                        y2="10.49"
                      />
                    </svg>
                  </button>

                  {/* 編輯 */}
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenEdit(
                        activity
                      )
                    }
                    style={{
                      width: 42,
                      height: 42,
                      border: "none",
                      borderRadius:
                        10,
                      background:
                        "#2563EB",
                      color: "#fff",
                      cursor:
                        "pointer",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                    }}
                    aria-label="編輯活動"
                    title="編輯活動"
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>

                  {/* 刪除 */}
                  <button
                    type="button"
                    onClick={() =>
                      void handleDelete(
                        activity.id
                      )
                    }
                    style={{
                      width: 42,
                      height: 42,
                      border: "none",
                      borderRadius:
                        10,
                      background:
                        "#DC2626",
                      color: "#fff",
                      cursor:
                        "pointer",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                    }}
                    aria-label="刪除活動"
                    title="刪除活動"
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* 新增 / 編輯 Modal */}
      {openModal && (
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
            padding: 20,
            boxSizing:
              "border-box",
          }}
        >
          <div
            style={{
              width: 560,
              maxWidth:
                "100%",
              background: "#fff",
              borderRadius:
                radius.lg,
              boxShadow:
                shadow.lg,
              padding: 24,
              maxHeight:
                "90vh",
              overflowY:
                "auto",
              boxSizing:
                "border-box",
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
              {editingActivity
                ? "編輯活動"
                : "新增活動"}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 16,
              }}
            >
              {/* 活動名稱 */}
              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  活動名稱
                </label>

                <input
                  type="text"
                  value={
                    form.title
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        title:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="例如：樂齡歡唱"
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* 日期 */}
              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  活動日期
                </label>

                <input
                  type="date"
                  value={
                    form.date
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        date:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* 類型 */}
              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  活動類型
                </label>

                <select
                  value={
                    form.type
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        type:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={
                    inputStyle
                  }
                >
                  <option value="">
                    請選擇類型
                  </option>

                  <option value="課程活動">
                    課程活動
                  </option>

                  <option value="健康活動">
                    健康活動
                  </option>

                  <option value="節慶活動">
                    節慶活動
                  </option>

                  <option value="社區活動">
                    社區活動
                  </option>

                  <option value="其他">
                    其他
                  </option>
                </select>
              </div>

              {/* 開始時間 */}
              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  開始時間
                </label>

                <input
                  type="time"
                  value={
                    form.startTime
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        startTime:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* 結束時間 */}
              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  結束時間
                </label>

                <input
                  type="time"
                  value={
                    form.endTime
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        endTime:
                          e.target
                            .value,
                      })
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* 地點 */}
              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  活動地點
                </label>

                <input
                  type="text"
                  value={
                    form.location
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        location:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="例如：活動教室"
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* 人數 */}
              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  活動人數
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    form.capacity
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        capacity:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="例如：30"
                  style={
                    inputStyle
                  }
                />
              </div>

              {/* 備註 */}
              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  備註
                </label>

                <textarea
                  value={
                    form.note
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        note:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="活動備註"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize:
                      "vertical",
                  }}
                />
              </div>
            </div>

            {/* Modal 按鈕 */}
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
                type="button"
                onClick={
                  handleClose
                }
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
                      ? "default"
                      : "pointer",
                  opacity:
                    saving ? 0.6 : 1,
                }}
              >
                取消
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleSave()
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
                      ? "default"
                      : "pointer",
                  fontWeight: 600,
                  opacity:
                    saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "儲存中..."
                  : editingActivity
                    ? "儲存修改"
                    : "新增活動"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const infoLabelStyle:
  React.CSSProperties = {
  fontSize: 12,
  color: "#9CA3AF",
  marginBottom: 5,
};

const infoValueStyle:
  React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
};

const labelStyle:
  React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  fontSize: 14,
};

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  padding: 10,
  border:
    "1px solid #D1D5DB",
  borderRadius: radius.md,
  boxSizing: "border-box",
  background: "#fff",
};