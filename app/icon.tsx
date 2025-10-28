import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "64px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0F172A",
          borderRadius: "14px",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="4"
            y="4"
            width="32"
            height="12"
            rx="3"
            fill="#111827"
            stroke="#FACC15"
            strokeWidth="3"
          />
          <rect
            x="4"
            y="24"
            width="32"
            height="12"
            rx="3"
            fill="#111827"
            stroke="#FACC15"
            strokeWidth="3"
          />
          <circle cx="10" cy="10" r="2.5" fill="#FACC15" />
          <circle cx="10" cy="30" r="2.5" fill="#FACC15" />
          <path
            d="M16 14H30"
            stroke="#FACC15"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M16 34H30"
            stroke="#FACC15"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>
      </div>
    ),
    size
  );
}
