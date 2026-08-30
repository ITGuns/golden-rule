"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f17",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
        <p style={{ opacity: 0.6, maxWidth: 420 }}>
          An unexpected error occurred{error.digest ? ` (ref ${error.digest})` : ""}. You can try
          again, or call Golden Rule at 281-500-7874.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            background: "#fccd35",
            color: "#0a0b0d",
            border: "2px solid #0a0b0d",
            borderRadius: 12,
            padding: "0.75rem 1.75rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
