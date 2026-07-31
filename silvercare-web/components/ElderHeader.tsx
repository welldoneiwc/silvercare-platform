"use client";

type Props = {
  onBack: () => void;
};

export default function ElderHeader({
  onBack,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "28px",
            color: "#163A43",
          }}
        >
          長者詳細資料
        </h2>

        <p
          style={{
            marginTop: "8px",
            color: "#666",
            fontSize: "15px",
          }}
        >
          檢視長者基本資訊
        </p>
      </div>

      <button
        onClick={onBack}
        style={{
          background: "#163A43",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "10px 18px",
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: 600,
        }}
      >
        返回列表
      </button>
    </div>
  );
}