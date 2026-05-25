"use client";

import React from "react";

const LoaderSpinner = ({
  wrapperClassName = "inline-flex items-center justify-center",
  className = "text-gray-800",
  color,
  size = 32,
}) => {
  const segmentAngles = Array.from({ length: 24 }, (_, index) => index * 15);

  return (
    <div className={wrapperClassName}>
      <svg
        viewBox="0 0 200 200"
        aria-label="Loading"
        role="img"
        className={`wave-loader-svg ${className}`}
        style={color ? { color } : undefined}
      >
        {segmentAngles.map((angle, index) => (
          <rect
            key={angle}
            className="wave-loader-seg"
            x="97"
            y="20"
            width="10"
            height="20"
            rx="2"
            style={{
              "--angle": `${angle}deg`,
              animationDelay: `${(index % 12) * 0.13}s`,
            }}
          />
        ))}
      </svg>

      <style jsx>{`
        .wave-loader-svg {
          width: ${size}px;
          height: ${size}px;
        }

        .wave-loader-seg {
          fill: currentColor;
          transform-origin: 100px 100px;
          animation: wave 1.6s linear infinite;
        }

        @keyframes wave {
          0%,
          35%,
          65%,
          100% {
            transform: rotate(var(--angle)) scaleX(1);
          }

          45% {
            transform: rotate(var(--angle)) scaleX(0.6);
          }

          50% {
            transform: rotate(var(--angle)) scaleX(0.4);
          }

          55% {
            transform: rotate(var(--angle)) scaleX(0.6);
          }
        }
      `}</style>
    </div>
  );
};

export default LoaderSpinner;