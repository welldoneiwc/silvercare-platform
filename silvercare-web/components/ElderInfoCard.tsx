"use client";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

export type Elder = {
  id: number;
  name: string;
  gender: string;
  birthday: string;
  phone: string;
};

type Props = {
  elder: Elder;
};

function calculateAge(birthday: string): number {
  const birth = new Date(birthday);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const month = today.getMonth() - birth.getMonth();

  if (
    month < 0 ||
    (month === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

export default function ElderInfoCard({ elder }: Props) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        border: `1px solid ${colors.border}`,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <h2
        style={{
          margin: "0 0 20px",
          color: colors.primary,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        長者基本資料
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <InfoItem label="姓名" value={elder.name} />
        <InfoItem label="性別" value={elder.gender} />
        <InfoItem label="生日" value={elder.birthday} />
        <InfoItem
          label="年齡"
          value={`${calculateAge(elder.birthday)} 歲`}
        />
        <InfoItem
          label="電話"
          value={elder.phone || "-"}
        />
      </div>
    </div>
  );
}

type InfoItemProps = {
  label: string;
  value: string;
};

function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div
      style={{
        background: "#fafafa",
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: 13,
         color: colors.textLight,
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {value}
      </div>
    </div>
  );
}