"use client";

import {
  useEffect,
  useState,
} from "react";

import { createPortal } from "react-dom";

type Elder = {
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

type ElderFormData = {
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
  open: boolean;
  onClose: () => void;
  onSave: (elder: ElderFormData) => void;
  onUpdate: (elder: Elder) => void;
  isEditing: boolean;
  editingElder: Elder | null;
};

export default function AddElderModal({
  open,
  onClose,
  onSave,
  onUpdate,
  isEditing,
  editingElder,
}: Props) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("男");
  const [birthday, setBirthday] = useState("");
  const [phone, setPhone] = useState("");

  const [elderType, setElderType] =
    useState("出席型");

  const [livingStatus, setLivingStatus] =
    useState("一般");

  const [contactMethod, setContactMethod] =
    useState("電話");

  const [
    emergencyContactName,
    setEmergencyContactName,
  ] = useState("");

  const [
    emergencyContactRelation,
    setEmergencyContactRelation,
  ] = useState("");

  const [
    emergencyContactPhone,
    setEmergencyContactPhone,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    if (isEditing && editingElder) {
      setName(editingElder.name);
      setGender(editingElder.gender);
      setBirthday(editingElder.birthday);
      setPhone(editingElder.phone);

      setElderType(
        editingElder.elder_type ||
          "出席型"
      );

      setLivingStatus(
        editingElder.living_status ||
          "一般"
      );

      setContactMethod(
        editingElder.contact_method ||
          "電話"
      );

      setEmergencyContactName(
        editingElder.emergency_contact_name ||
          ""
      );

      setEmergencyContactRelation(
        editingElder.emergency_contact_relation ||
          ""
      );

      setEmergencyContactPhone(
        editingElder.emergency_contact_phone ||
          ""
      );
    } else {
      setName("");
      setGender("男");
      setBirthday("");
      setPhone("");

      setElderType("出席型");
      setLivingStatus("一般");
      setContactMethod("電話");

      setEmergencyContactName("");
      setEmergencyContactRelation("");
      setEmergencyContactPhone("");
    }
  }, [
    open,
    isEditing,
    editingElder,
  ]);

  /**
   * Modal 開啟時：
   * - 鎖定背景
   * - 加入全域 modal 狀態
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    document.body.classList.add(
      "silvercare-elder-modal-open"
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.body.classList.remove(
        "silvercare-elder-modal-open"
      );
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = () => {
    if (
      !name.trim() ||
      !birthday ||
      !phone.trim()
    ) {
      alert(
        "請完整填寫姓名、生日與電話"
      );
      return;
    }

    const formData: ElderFormData = {
      name: name.trim(),
      gender,
      birthday,
      phone: phone.trim(),
      elder_type: elderType,
      living_status: livingStatus,
      contact_method: contactMethod,
      emergency_contact_name:
        emergencyContactName.trim(),
      emergency_contact_relation:
        emergencyContactRelation.trim(),
      emergency_contact_phone:
        emergencyContactPhone.trim(),
    };

    if (
      isEditing &&
      editingElder
    ) {
      onUpdate({
        id: editingElder.id,
        ...formData,
      });
    } else {
      onSave(formData);
    }

    setName("");
    setGender("男");
    setBirthday("");
    setPhone("");

    setElderType("出席型");
    setLivingStatus("一般");
    setContactMethod("電話");

    setEmergencyContactName("");
    setEmergencyContactRelation("");
    setEmergencyContactPhone("");

    onClose();
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    borderRadius: "8px",
    border:
      "1px solid #D1D5DB",
    boxSizing:
      "border-box" as const,
    fontSize: "15px",
  };

  const sectionTitleStyle = {
    marginTop: "24px",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom:
      "1px solid #E5E7EB",
    color: "#163A43",
    fontSize: "17px",
    fontWeight: 700,
  };

  const modalContent = (
    <>
      <style>{`
        body.silvercare-elder-modal-open
        .silvercare-mobile-navigation {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        body.silvercare-elder-modal-open
        .silvercare-mobile-header-logout {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        body.silvercare-elder-modal-open {
          overflow: hidden !important;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          background:
            "rgba(0,0,0,0.45)",
          display: "flex",
          justifyContent:
            "center",
          alignItems: "center",
          zIndex: 2147483647,
          padding:
            "16px 16px calc(16px + env(safe-area-inset-bottom))",
          boxSizing:
            "border-box",
          overscrollBehavior:
            "contain",
          isolation: "isolate",
          touchAction: "none",
        }}
        onClick={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose();
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="silvercare-elder-modal-title"
          style={{
            background: "#fff",
            width: "520px",
            maxWidth: "100%",
            maxHeight:
              "calc(100dvh - 32px - env(safe-area-inset-bottom))",
            overflowY: "auto",
            WebkitOverflowScrolling:
              "touch",
            overscrollBehavior:
              "contain",
            borderRadius: "16px",
            padding: "24px",
            boxSizing:
              "border-box",
            touchAction: "pan-y",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.25)",
          }}
        >
          <h2
            id="silvercare-elder-modal-title"
            style={{
              margin: 0,
              color: "#163A43",
            }}
          >
            {isEditing
              ? "編輯長者"
              : "新增長者"}
          </h2>

          <div
            style={sectionTitleStyle}
          >
            基本資料
          </div>

          <div>
            <label>姓名</label>

            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          <div
            style={{
              marginTop: "15px",
            }}
          >
            <label>性別</label>

            <select
              value={gender}
              onChange={(e) =>
                setGender(
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="男">
                男
              </option>

              <option value="女">
                女
              </option>
            </select>
          </div>

          <div
            style={{
              marginTop: "15px",
            }}
          >
            <label>生日</label>

            <input
              type="date"
              value={birthday}
              onChange={(e) =>
                setBirthday(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          <div
            style={{
              marginTop: "15px",
            }}
          >
            <label>電話</label>

            <input
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          <div
            style={sectionTitleStyle}
          >
            長者屬性
          </div>

          <div>
            <label>長者類型</label>

            <select
              value={elderType}
              onChange={(e) =>
                setElderType(
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="探訪型">
                探訪型
              </option>

              <option value="出席型">
                出席型
              </option>
            </select>
          </div>

          <div
            style={{
              marginTop: "15px",
            }}
          >
            <label>
              居住狀態
            </label>

            <select
              value={livingStatus}
              onChange={(e) =>
                setLivingStatus(
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="一般">
                一般
              </option>

              <option value="獨居">
                獨居
              </option>
            </select>
          </div>

          <div
            style={{
              marginTop: "15px",
            }}
          >
            <label>
              聯絡方式
            </label>

            <select
              value={contactMethod}
              onChange={(e) =>
                setContactMethod(
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="電話">
                電話
              </option>

              <option value="電訪">
                電訪
              </option>

              <option value="其他">
                其他
              </option>
            </select>
          </div>

          <div
            style={sectionTitleStyle}
          >
            緊急聯絡人
          </div>

          <div>
            <label>
              緊急聯絡人姓名
            </label>

            <input
              value={
                emergencyContactName
              }
              onChange={(e) =>
                setEmergencyContactName(
                  e.target.value
                )
              }
              placeholder="例如：王小明"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              marginTop: "15px",
            }}
          >
            <label>
              與長者關係
            </label>

            <input
              value={
                emergencyContactRelation
              }
              onChange={(e) =>
                setEmergencyContactRelation(
                  e.target.value
                )
              }
              placeholder="例如：女兒、兒子、配偶"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              marginTop: "15px",
            }}
          >
            <label>
              緊急聯絡人電話
            </label>

            <input
              value={
                emergencyContactPhone
              }
              onChange={(e) =>
                setEmergencyContactPhone(
                  e.target.value
                )
              }
              placeholder="請輸入聯絡電話"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              gap: "10px",
              marginTop: "25px",
              paddingTop: "4px",
              paddingBottom:
                "max(4px, env(safe-area-inset-bottom))",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding:
                  "10px 18px",
                borderRadius: "8px",
                border:
                  "1px solid #D1D5DB",
                background: "#fff",
                cursor:
                  "pointer",
                fontWeight: 600,
              }}
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              style={{
                background:
                  "#163A43",
                color: "#fff",
                border: "none",
                padding:
                  "10px 18px",
                borderRadius: "8px",
                cursor:
                  "pointer",
                fontWeight: 600,
              }}
            >
              {isEditing
                ? "更新資料"
                : "儲存"}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(
    modalContent,
    document.body
  );
}