import React, { useEffect } from "react";

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return <div style={{ backgroundColor: "black", width: "100%", height: "100vh" }} />;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 700);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black"
    />
  );
}