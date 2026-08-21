import React from "react";
import { Toaster } from "react-hot-toast";

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: { background: "#111827", color: "#fff" },
        success: { duration: 3000 },
      }}
    />
  );
}
