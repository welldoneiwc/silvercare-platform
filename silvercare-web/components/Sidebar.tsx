import { colors } from "../styles/theme";
export default function Sidebar() {
  return (
    <div
      style={{
        width: "250px",
        height: "100vh",
        background: "#163A43",
        color: "white",
        padding: "20px",
      }}
    >
      <h2>SilverCare</h2>

      <hr />

      <p>🏠 首頁</p>
      <p>👥 長者管理</p>
      <p>❤️ 健康量測</p>
      <p>📚 課程管理</p>
      <p>📅 活動管理</p>
      <p>⚙️ 系統設定</p>
    </div>
  );
}