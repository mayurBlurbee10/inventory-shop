import React, { useState } from "react";

export const Avatar = ({ src, alt, fallbackText }) => {
  const [error, setError] = useState(false);

  return (
    <>
      {!error ? (
        <img
          src={src}
          alt={alt}
          className="w-9 h-9 rounded-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-lg">
          {fallbackText}
        </div>
      )}
    </>
  );
};
