"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTodayMessage } from "@/lib/motivationalMessages";

export default function WelcomeModal({ userId }) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function checkFirstLoginToday() {
      const today = new Date().toISOString().split("T")[0];

      const { data: profile } = await supabase
        .from("profiles")
        .select("last_seen_welcome")
        .eq("id", userId)
        .single();

      if (profile?.last_seen_welcome !== today) {
        setMessage(getTodayMessage());
        setShow(true);

        await supabase
          .from("profiles")
          .update({ last_seen_welcome: today })
          .eq("id", userId);
      }
    }

    if (userId) checkFirstLoginToday();
  }, [userId]);

  if (!show || !message) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 text-center shadow-xl">
        <div className="text-5xl mb-3">{message.icon}</div>
        <h2 className="text-xl font-bold text-green-700 mb-2">{message.title}</h2>
        <p className="text-gray-600 mb-5">{message.body}</p>
        <button
          onClick={() => setShow(false)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          يلا نبدأ 🌱
        </button>
      </div>
    </div>
  );
}