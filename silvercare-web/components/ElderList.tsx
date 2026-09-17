"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AddElderModal from "./AddElderModal";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";
import { notifyStorageChanged } from "../utils/storageEvents";
import { supabase } from "../utils/supabase";

export type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
  elder_type: string;
  living_status: string;
  contact_method: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
};

type Props = {
  onSelectElder: (elder: Elder) => void;
};

function calculateAge(
  birthday: string
): number {
  if (!birthday) {
    return 0;
  }

  const birth = new Date(birthday);
  const today = new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const month =
    today.getMonth() -
    birth.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() <
        birth.getDate())
  ) {
    age--;
  }

  return age;
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      width="18"
      height="18"
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
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function PlusIcon() {
  return (
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export default function ElderList({
  onSelectElder,
}: Props) {
  const [elders, setElders] =
    useState<Elder[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [keyword, setKeyword] =
    useState("");

  const [open, setOpen] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [editingElder, setEditingElder] =
    useState<Elder | null>(null);

  const [currentRole, setCurrentRole] =
    useState("");

  const [currentLocationId, setCurrentLocationId] =
    useState<number | null>(null);

  /**
   * 取得 Supervisor 目前選取的據點
   *
   * 不同版本的據點切換程式可能使用不同 key，
   * 因此依序檢查目前可能存在的 key。
   */
  const getSelectedLocationId =
    useCallback(() => {
      if (
        typeof window ===
        "undefined"
      ) {
        return null;
      }

      const keys = [
        "silvercare-selected-location-id",
        "silvercare-selected-location",
        "selectedLocationId",
        "selected-location-id",
      ];

      for (
        const key of keys
      ) {
        const value =
          window.localStorage.getItem(
            key
          );

        if (
          value === null ||
          value === ""
        ) {
          continue;
        }

        const parsed =
          Number(value);

        if (
          Number.isFinite(
            parsed
          ) &&
          parsed > 0
        ) {
          return parsed;
        }
      }

      return null;
    }, []);

  /**
   * 取得目前登入帳號的角色與據點
   */
  const getUserContext =
    useCallback(async () => {
      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.getUser();

      const user =
        authData.user;

      if (
        authError ||
        !user
      ) {
        console.error(
          "取得目前登入使用者失敗：",
          authError
        );

        return null;
      }

      console.log(
        "目前登入使用者：",
        {
          id: user.id,
          email: user.email,
        }
      );

      const {
        data: roleData,
        error: roleError,
      } =
        await supabase
          .from("user_roles")
          .select(
            `
              role,
              location_id
            `
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (roleError) {
        console.error(
          "取得使用者角色失敗：",
          roleError
        );

        return null;
      }

      const role =
        roleData?.role ??
        "";

      const roleLocationId =
        roleData?.location_id !=
        null
          ? Number(
              roleData.location_id
            )
          : null;

      let selectedLocationId:
        | number
        | null = null;

      if (
        role ===
        "supervisor"
      ) {
        selectedLocationId =
          getSelectedLocationId();
      }

      let effectiveLocationId:
        | number
        | null = null;

      if (
        role === "site"
      ) {
        effectiveLocationId =
          roleLocationId;
      } else if (
        role ===
        "supervisor"
      ) {
        effectiveLocationId =
          selectedLocationId;
      } else {
        effectiveLocationId =
          roleLocationId;
      }

      console.log(
        "ElderList 據點權限：",
        {
          email: user.email,
          role,
          roleLocationId,
          selectedLocationId,
          effectiveLocationId,
        }
      );

      return {
        user,
        role,
        roleLocationId,
        selectedLocationId,
        effectiveLocationId,
      };
    }, [
      getSelectedLocationId,
    ]);

  /**
   * 載入長者資料
   *
   * Site：
   * 只載入自己的 location_id。
   *
   * Supervisor：
   * 如果有選取據點，就只載入該據點。
   * 如果尚未選取據點，則載入全部 elders，
   * 讓 Supervisor 的長者管理可以正常看到全部資料。
   */
  const loadElders =
    useCallback(async () => {
      setLoaded(false);

      try {
        const context =
          await getUserContext();

        if (!context) {
          setElders([]);
          setCurrentRole("");
          setCurrentLocationId(
            null
          );
          setLoaded(true);
          return;
        }

        setCurrentRole(
          context.role
        );

        setCurrentLocationId(
          context.effectiveLocationId
        );

        console.log(
          "開始讀取 elders：",
          {
            role:
              context.role,
            location_id:
              context.effectiveLocationId,
          }
        );

        let query =
          supabase
            .from("elders")
            .select(
              `
                id,
                name,
                gender,
                birthday,
                phone,
                elder_type,
                living_status,
                contact_method,
                emergency_contact_name,
                emergency_contact_relation,
                emergency_contact_phone
              `
            );

        /**
         * Site：
         * 必須限制在自己的 location_id。
         *
         * Supervisor：
         * 有選據點時限制該據點。
         * 沒有選據點時不加 location_id filter，
         * 因此可以讀到全部據點的長者。
         */
        if (
          context.role ===
          "site"
        ) {
          if (
            !context.roleLocationId
          ) {
            console.warn(
              "Site 帳號沒有有效的 location_id，暫不載入長者資料。"
            );

            setElders([]);
            setLoaded(true);
            return;
          }

          query =
            query.eq(
              "location_id",
              context.roleLocationId
            );
        } else if (
          context.role ===
          "supervisor"
        ) {
          if (
            context.effectiveLocationId
          ) {
            query =
              query.eq(
                "location_id",
                context.effectiveLocationId
              );
          }
        } else {
          if (
            context.effectiveLocationId
          ) {
            query =
              query.eq(
                "location_id",
                context.effectiveLocationId
              );
          }
        }

        const {
          data,
          error,
        } =
          await query.order(
            "id",
            {
              ascending: true,
            }
          );

        if (error) {
          console.error(
            "讀取長者資料失敗：",
            {
              message:
                error.message,
              details:
                error.details,
              hint:
                error.hint,
              code:
                error.code,
            }
          );

          setElders([]);
          setLoaded(true);
          return;
        }

        console.log(
          "長者資料讀取結果：",
          {
            role:
              context.role,
            location_id:
              context.effectiveLocationId,
            count:
              data?.length ?? 0,
          }
        );

        const safeData: Elder[] =
          (data ?? []).map(
            (item) => ({
              id: Number(
                item.id
              ),
              name:
                item.name ??
                "",
              gender:
                item.gender ??
                "",
              birthday:
                item.birthday ??
                "",
              phone:
                item.phone ??
                "",
              elder_type:
                item.elder_type ??
                "出席型",
              living_status:
                item.living_status ??
                "一般",
              contact_method:
                item.contact_method ??
                "電話",
              emergency_contact_name:
                item.emergency_contact_name ??
                "",
              emergency_contact_relation:
                item.emergency_contact_relation ??
                "",
              emergency_contact_phone:
                item.emergency_contact_phone ??
                "",
            })
          );

        setElders(
          safeData
        );
        setLoaded(true);
      } catch (error) {
        console.error(
          "讀取長者資料發生錯誤：",
          error
        );

        setElders([]);
        setLoaded(true);
      }
    }, [
      getUserContext,
    ]);

  /**
   * 第一次載入
   */
  useEffect(() => {
    loadElders();
  }, [
    loadElders,
  ]);

  /**
   * 據點切換後重新載入
   *
   * SilverCare 現有的 storage event：
   * silvercare-storage-changed
   */
  useEffect(() => {
    const handleStorageChanged =
      () => {
        console.log(
          "ElderList 收到據點 / 資料變更事件，重新載入。"
        );

        loadElders();
      };

    window.addEventListener(
      "storage",
      handleStorageChanged
    );

    window.addEventListener(
      "silvercare-storage-changed",
      handleStorageChanged
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChanged
      );

      window.removeEventListener(
        "silvercare-storage-changed",
        handleStorageChanged
      );
    };
  }, [
    loadElders,
  ]);

  /**
   * 預覽長者
   */
  const handlePreviewElder = (
    elder: Elder
  ) => {
    onSelectElder(
      elder
    );

    if (
      typeof window !==
      "undefined"
    ) {
      window.setTimeout(
        () => {
          window.scrollTo({
            top:
              document.documentElement
                .scrollHeight,
            behavior:
              "smooth",
          });
        },
        120
      );
    }
  };

  /**
   * 新增長者
   */
  const handleAddElder =
    async (
      elder: Omit<
        Elder,
        "id"
      >
    ) => {
      try {
        const context =
          await getUserContext();

        if (!context) {
          window.alert(
            "無法確認目前登入帳號，請重新登入後再試。"
          );
          return;
        }

        if (
          !context.effectiveLocationId
        ) {
          window.alert(
            "目前帳號沒有有效的據點，無法新增長者。"
          );
          return;
        }

        const insertData:
          Record<
            string,
            unknown
          > = {
          name:
            elder.name,
          gender:
            elder.gender,
          birthday:
            elder.birthday,
          phone:
            elder.phone,
          elder_type:
            elder.elder_type,
          living_status:
            elder.living_status,
          contact_method:
            elder.contact_method,
          emergency_contact_name:
            elder.emergency_contact_name,
          emergency_contact_relation:
            elder.emergency_contact_relation,
          emergency_contact_phone:
            elder.emergency_contact_phone,
          location_id:
            Number(
              context.effectiveLocationId
            ),
        };

        console.log(
          "新增長者資料：",
          insertData
        );

        const {
          data,
          error,
        } =
          await supabase
            .from("elders")
            .insert(
              insertData
            )
            .select(
              `
                id,
                name,
                gender,
                birthday,
                phone,
                elder_type,
                living_status,
                contact_method,
                emergency_contact_name,
                emergency_contact_relation,
                emergency_contact_phone
              `
            )
            .single();

        if (error) {
          console.error(
            "新增長者失敗：",
            {
              message:
                error.message,
              details:
                error.details,
              hint:
                error.hint,
              code:
                error.code,
            }
          );

          window.alert(
            `新增長者失敗：${error.message}`
          );

          return;
        }

        if (!data) {
          window.alert(
            "新增長者失敗：沒有取得新增資料。"
          );

          return;
        }

        const newElder:
          Elder = {
          id: Number(
            data.id
          ),
          name:
            data.name ??
            "",
          gender:
            data.gender ??
            "",
          birthday:
            data.birthday ??
            "",
          phone:
            data.phone ??
            "",
          elder_type:
            data.elder_type ??
            "出席型",
          living_status:
            data.living_status ??
            "一般",
          contact_method:
            data.contact_method ??
            "電話",
          emergency_contact_name:
            data.emergency_contact_name ??
            "",
          emergency_contact_relation:
            data.emergency_contact_relation ??
            "",
          emergency_contact_phone:
            data.emergency_contact_phone ??
            "",
        };

        setElders(
          (prev) => [
            ...prev,
            newElder,
          ]
        );

        notifyStorageChanged();
      } catch (error) {
        console.error(
          "新增長者發生錯誤：",
          error
        );

        window.alert(
          "新增長者失敗，請稍後再試。"
        );
      }
    };

  /**
   * 更新長者
   */
  const handleUpdateElder =
    async (
      elder: Elder
    ) => {
      try {
        const context =
          await getUserContext();

        if (!context) {
          window.alert(
            "無法確認目前登入帳號，請重新登入後再試。"
          );
          return;
        }

        if (
          !context.effectiveLocationId
        ) {
          window.alert(
            "目前帳號沒有有效的據點，無法更新長者。"
          );
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from("elders")
            .update({
              name:
                elder.name,
              gender:
                elder.gender,
              birthday:
                elder.birthday,
              phone:
                elder.phone,
              elder_type:
                elder.elder_type,
              living_status:
                elder.living_status,
              contact_method:
                elder.contact_method,
              emergency_contact_name:
                elder.emergency_contact_name,
              emergency_contact_relation:
                elder.emergency_contact_relation,
              emergency_contact_phone:
                elder.emergency_contact_phone,
            })
            .eq(
              "id",
              elder.id
            )
            .eq(
              "location_id",
              context.effectiveLocationId
            )
            .select(
              `
                id,
                name,
                gender,
                birthday,
                phone,
                elder_type,
                living_status,
                contact_method,
                emergency_contact_name,
                emergency_contact_relation,
                emergency_contact_phone
              `
            )
            .single();

        if (error) {
          console.error(
            "更新長者失敗：",
            error
          );

          window.alert(
            `更新長者失敗：${error.message}`
          );

          return;
        }

        if (!data) {
          window.alert(
            "更新長者失敗：沒有取得更新資料。"
          );

          return;
        }

        const updatedElder:
          Elder = {
          id: Number(
            data.id
          ),
          name:
            data.name ??
            "",
          gender:
            data.gender ??
            "",
          birthday:
            data.birthday ??
            "",
          phone:
            data.phone ??
            "",
          elder_type:
            data.elder_type ??
            "出席型",
          living_status:
            data.living_status ??
            "一般",
          contact_method:
            data.contact_method ??
            "電話",
          emergency_contact_name:
            data.emergency_contact_name ??
            "",
          emergency_contact_relation:
            data.emergency_contact_relation ??
            "",
          emergency_contact_phone:
            data.emergency_contact_phone ??
            "",
        };

        setElders(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                elder.id
                  ? updatedElder
                  : item
            )
        );

        notifyStorageChanged();
      } catch (error) {
        console.error(
          "更新長者發生錯誤：",
          error
        );

        window.alert(
          "更新長者失敗，請稍後再試。"
        );
      }
    };

  /**
   * 刪除長者
   */
  const handleDeleteElder =
    async (
      id: number
    ) => {
      const confirmDelete =
        window.confirm(
          "確定要刪除此長者嗎？"
        );

      if (!confirmDelete) {
        return;
      }

      try {
        const context =
          await getUserContext();

        if (!context) {
          window.alert(
            "無法確認目前登入帳號，請重新登入後再試。"
          );
          return;
        }

        if (
          !context.effectiveLocationId
        ) {
          window.alert(
            "目前帳號沒有有效的據點，無法刪除長者。"
          );
          return;
        }

        const {
          error,
        } =
          await supabase
            .from("elders")
            .delete()
            .eq(
              "id",
              id
            )
            .eq(
              "location_id",
              context.effectiveLocationId
            );

        if (error) {
          console.error(
            "刪除長者失敗：",
            error
          );

          window.alert(
            `刪除長者失敗：${error.message}`
          );

          return;
        }

        setElders(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !==
                id
            )
        );

        localStorage.removeItem(
          `health-records-${id}`
        );

        notifyStorageChanged();
      } catch (error) {
        console.error(
          "刪除長者發生錯誤：",
          error
        );

        window.alert(
          "刪除長者失敗，請稍後再試。"
        );
      }
    };

  const filteredElders =
    useMemo(() => {
      console.log(
        "Elder Debug:",
        {
          elders:
            elders.length,
          keyword,
          role:
            currentRole,
          location_id:
            currentLocationId,
        }
      );

      return elders.filter(
        (elder) => {
          return (
            elder.name.includes(
              keyword
            ) ||
            elder.phone.includes(
              keyword
            ) ||
            elder.gender.includes(
              keyword
            ) ||
            elder.elder_type.includes(
              keyword
            ) ||
            elder.living_status.includes(
              keyword
            ) ||
            elder.contact_method.includes(
              keyword
            ) ||
            elder.emergency_contact_name.includes(
              keyword
            )
          );
        }
      );
    }, [
      elders,
      keyword,
      currentRole,
      currentLocationId,
    ]);

  return (
    <>
      <style>{`
        .silvercare-elder-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .silvercare-elder-search {
          width: 220px;
          min-width: 0;
          box-sizing: border-box;
        }

        .silvercare-elder-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .silvercare-elder-desktop-table {
          display: table;
          width: 100%;
          border-collapse: collapse;
          min-width: 620px;
        }

        .silvercare-elder-mobile-list {
          display: none;
        }

        .silvercare-elder-action-group {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .silvercare-elder-action-button {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border-radius: 8px;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .silvercare-elder-card {
          width: 100%;
          box-sizing: border-box;
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .silvercare-elder-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .silvercare-elder-card-name {
          color: ${colors.primary};
          font-size: 18px;
          font-weight: 700;
          line-height: 1.35;
          word-break: break-word;
        }

        .silvercare-elder-card-phone {
          margin-top: 4px;
          color: #6B7280;
          font-size: 13px;
          word-break: break-word;
        }

        .silvercare-elder-card-actions {
          display: flex;
          gap: 6px;
          flex: 0 0 auto;
        }

        .silvercare-elder-card-details {
          margin-top: 14px;
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .silvercare-elder-card-detail {
          min-width: 0;
          padding: 10px 12px;
          background: #F8FAFC;
          border-radius: 8px;
          box-sizing: border-box;
        }

        .silvercare-elder-card-detail-label {
          color: #94A3B8;
          font-size: 11px;
        }

        .silvercare-elder-card-detail-value {
          margin-top: 3px;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          word-break: break-word;
        }

        @media (max-width: 767px) {
          .silvercare-elder-container {
            padding: 16px !important;
            border-radius: 14px !important;
          }

          .silvercare-elder-header {
            align-items: stretch !important;
          }

          .silvercare-elder-header-actions {
            width: 100%;
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .silvercare-elder-search {
            flex: 1;
            width: auto !important;
            height: 40px;
            min-width: 0;
          }

          .silvercare-elder-add-button {
            width: 40px !important;
            height: 40px !important;
            flex: 0 0 40px;
          }

          .silvercare-elder-table-wrap {
            display: none;
          }

          .silvercare-elder-mobile-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .silvercare-elder-mobile-empty {
            padding: 28px 16px;
            text-align: center;
            color: #6B7280;
            background: #F8FAFC;
            border-radius: 10px;
          }
        }
      `}</style>

      <div
        className="silvercare-elder-container"
        style={{
          background:
            colors.card,
          padding: 30,
          borderRadius:
            radius.lg,
          boxShadow:
            shadow.md,
          width: "100%",
          minWidth: 0,
          boxSizing:
            "border-box",
        }}
      >
        <div
          className="silvercare-elder-header"
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                color:
                  colors.primary,
              }}
            >
              長者管理
            </h2>

            <div
              style={{
                color: "#666",
                fontSize: 14,
                marginTop: 6,
              }}
            >
              共{" "}
              {
                filteredElders.length
              }{" "}
              位長者
            </div>
          </div>

          <div className="silvercare-elder-header-actions">
            <input
              className="silvercare-elder-search"
              placeholder="搜尋姓名 / 電話"
              value={
                keyword
              }
              onChange={(
                e
              ) =>
                setKeyword(
                  e.target.value
                )
              }
              style={{
                padding:
                  "10px 12px",
                borderRadius: 8,
                border:
                  "1px solid #D1D5DB",
                background:
                  "#fff",
                fontSize: 14,
                outline:
                  "none",
              }}
            />

            <button
              type="button"
              title="新增長者"
              aria-label="新增長者"
              className="silvercare-elder-add-button"
              onClick={() => {
                setIsEditing(
                  false
                );
                setEditingElder(
                  null
                );
                setOpen(
                  true
                );
              }}
              style={{
                width: 40,
                height: 40,
                display:
                  "inline-flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                background:
                  colors.primary,
                color: "#fff",
                border:
                  "none",
                borderRadius: 10,
                cursor:
                  "pointer",
                flex: "0 0 40px",
              }}
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {!loaded ? (
          <div
            className="silvercare-elder-mobile-empty"
            style={{
              padding: 32,
              textAlign:
                "center",
              color:
                colors.textLight,
              background:
                "#F8FAFC",
              borderRadius: 10,
            }}
          >
            正在載入長者資料...
          </div>
        ) : filteredElders.length ===
          0 ? (
          <div
            className="silvercare-elder-mobile-empty"
            style={{
              padding: 32,
              textAlign:
                "center",
              color:
                colors.textLight,
              background:
                "#F8FAFC",
              borderRadius: 10,
            }}
          >
            尚無長者資料，請新增第一位長者。
          </div>
        ) : (
          <>
            <div className="silvercare-elder-table-wrap">
              <table className="silvercare-elder-desktop-table">
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign:
                          "left",
                        padding: 12,
                      }}
                    >
                      姓名
                    </th>

                    <th
                      style={{
                        textAlign:
                          "center",
                        padding: 12,
                      }}
                    >
                      性別
                    </th>

                    <th
                      style={{
                        textAlign:
                          "center",
                        padding: 12,
                      }}
                    >
                      年齡
                    </th>

                    <th
                      style={{
                        textAlign:
                          "left",
                        padding: 12,
                      }}
                    >
                      電話
                    </th>

                    <th
                      style={{
                        textAlign:
                          "center",
                        padding: 12,
                      }}
                    >
                      操作
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredElders.map(
                    (
                      elder
                    ) => (
                      <tr
                        key={
                          elder.id
                        }
                      >
                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          {
                            elder.name
                          }
                        </td>

                        <td
                          style={{
                            textAlign:
                              "center",
                            padding: 12,
                          }}
                        >
                          {
                            elder.gender
                          }
                        </td>

                        <td
                          style={{
                            textAlign:
                              "center",
                            padding: 12,
                          }}
                        >
                          {calculateAge(
                            elder.birthday
                          )}{" "}
                          歲
                        </td>

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          {
                            elder.phone
                          }
                        </td>

                        <td
                          style={{
                            textAlign:
                              "center",
                            padding: 12,
                          }}
                        >
                          <div className="silvercare-elder-action-group">
                            <button
                              type="button"
                              title="查看"
                              aria-label="查看"
                              className="silvercare-elder-action-button"
                              onClick={() =>
                                handlePreviewElder(
                                  elder
                                )
                              }
                              style={{
                                border:
                                  "none",
                                background:
                                  "#198754",
                                color:
                                  "#fff",
                              }}
                            >
                              <EyeIcon />
                            </button>

                            <button
                              type="button"
                              title="編輯"
                              aria-label="編輯"
                              className="silvercare-elder-action-button"
                              onClick={() => {
                                setEditingElder(
                                  elder
                                );
                                setIsEditing(
                                  true
                                );
                                setOpen(
                                  true
                                );
                              }}
                              style={{
                                border:
                                  "1px solid #D1D5DB",
                                background:
                                  "#fff",
                                color:
                                  "#374151",
                              }}
                            >
                              <EditIcon />
                            </button>

                            <button
                              type="button"
                              title="刪除"
                              aria-label="刪除"
                              className="silvercare-elder-action-button"
                              onClick={() =>
                                handleDeleteElder(
                                  elder.id
                                )
                              }
                              style={{
                                border:
                                  "none",
                                background:
                                  "#DC2626",
                                color:
                                  "#fff",
                              }}
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="silvercare-elder-mobile-list">
              {filteredElders.map(
                (
                  elder
                ) => (
                  <div
                    key={
                      elder.id
                    }
                    className="silvercare-elder-card"
                  >
                    <div className="silvercare-elder-card-top">
                      <div
                        style={{
                          minWidth:
                            0,
                        }}
                      >
                        <div className="silvercare-elder-card-name">
                          {
                            elder.name
                          }
                        </div>

                        {elder.phone && (
                          <div className="silvercare-elder-card-phone">
                            {
                              elder.phone
                            }
                          </div>
                        )}
                      </div>

                      <div className="silvercare-elder-card-actions">
                        <button
                          type="button"
                          title="查看"
                          aria-label="查看"
                          onClick={() =>
                            handlePreviewElder(
                              elder
                            )
                          }
                          style={{
                            width: 36,
                            height: 36,
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            padding: 0,
                            border:
                              "none",
                            borderRadius: 8,
                            background:
                              "#198754",
                            color:
                              "#fff",
                            cursor:
                              "pointer",
                          }}
                        >
                          <EyeIcon />
                        </button>

                        <button
                          type="button"
                          title="編輯"
                          aria-label="編輯"
                          onClick={() => {
                            setEditingElder(
                              elder
                            );
                            setIsEditing(
                              true
                            );
                            setOpen(
                              true
                            );
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            padding: 0,
                            border:
                              "1px solid #D1D5DB",
                            borderRadius: 8,
                            background:
                              "#fff",
                            color:
                              "#374151",
                            cursor:
                              "pointer",
                          }}
                        >
                          <EditIcon />
                        </button>

                        <button
                          type="button"
                          title="刪除"
                          aria-label="刪除"
                          onClick={() =>
                            handleDeleteElder(
                              elder.id
                            )
                          }
                          style={{
                            width: 36,
                            height: 36,
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            padding: 0,
                            border:
                              "none",
                            borderRadius: 8,
                            background:
                              "#DC2626",
                            color:
                              "#fff",
                            cursor:
                              "pointer",
                          }}
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>

                    <div className="silvercare-elder-card-details">
                      <div className="silvercare-elder-card-detail">
                        <div className="silvercare-elder-card-detail-label">
                          性別
                        </div>

                        <div className="silvercare-elder-card-detail-value">
                          {elder.gender ||
                            "未填寫"}
                        </div>
                      </div>

                      <div className="silvercare-elder-card-detail">
                        <div className="silvercare-elder-card-detail-label">
                          年齡
                        </div>

                        <div className="silvercare-elder-card-detail-value">
                          {calculateAge(
                            elder.birthday
                          )}{" "}
                          歲
                        </div>
                      </div>

                      <div className="silvercare-elder-card-detail">
                        <div className="silvercare-elder-card-detail-label">
                          長者類型
                        </div>

                        <div className="silvercare-elder-card-detail-value">
                          {elder.elder_type ||
                            "未填寫"}
                        </div>
                      </div>

                      <div className="silvercare-elder-card-detail">
                        <div className="silvercare-elder-card-detail-label">
                          居住／服務狀態
                        </div>

                        <div className="silvercare-elder-card-detail-value">
                          {elder.living_status ||
                            "未填寫"}
                        </div>
                      </div>

                      <div className="silvercare-elder-card-detail">
                        <div className="silvercare-elder-card-detail-label">
                          聯絡方式
                        </div>

                        <div className="silvercare-elder-card-detail-value">
                          {elder.contact_method ||
                            "未填寫"}
                        </div>
                      </div>

                      <div className="silvercare-elder-card-detail">
                        <div className="silvercare-elder-card-detail-label">
                          緊急聯絡人
                        </div>

                        <div className="silvercare-elder-card-detail-value">
                          {elder.emergency_contact_name ||
                            "未填寫"}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}

        <AddElderModal
          open={
            open
          }
          onClose={() => {
            setOpen(
              false
            );
            setEditingElder(
              null
            );
            setIsEditing(
              false
            );
          }}
          onSave={
            handleAddElder
          }
          onUpdate={
            handleUpdateElder
          }
          isEditing={
            isEditing
          }
          editingElder={
            editingElder
          }
        />
      </div>
    </>
  );
}