import React, { useEffect } from "react";

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return <div style={{ backgroundColor: "black", width: "100%", height: "100vh" }} />;
}