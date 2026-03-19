"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Share2, Moon, Star, Gift, Trash2, RefreshCw } from "lucide-react";

/**
 * Generates 16 dynamic wheel segments with realistic Eid fractions (.25, .50, .75).
 */
const generateWheelSegments = (maxAmount: number): number[] => {
  return [
    maxAmount, // The Jackpot!
    Math.floor(maxAmount * 0.1) + 0.25,
    Math.floor(maxAmount * 0.4) + 0.5,
    10, // Minimum base
    Math.floor(maxAmount * 0.25) + 0.75,
    0, // The dreaded zero!
    Math.floor(maxAmount * 0.6) + 0.25,
    Math.floor(maxAmount * 0.15) + 0.5,
    Math.floor(maxAmount * 0.8) + 0.75,
    20.5,
    Math.floor(maxAmount * 0.35) + 0.25,
    0, // Another zero for tension
    Math.floor(maxAmount * 0.7) + 0.5,
    Math.floor(maxAmount * 0.05) + 0.75,
    Math.floor(maxAmount * 0.9) + 0.25,
    5.75,
  ];
};

/**
 * Determines the contextual emoji based on the won amount vs the maximum amount.
 */
const getEmojiForAmount = (amount: number, maxAmount: number): string => {
  if (amount === 0) return "😭";
  if (amount === maxAmount) return "🤑🥳";
  if (amount < maxAmount * 0.1) return "🥲";
  if (amount < maxAmount * 0.4) return "😊";
  return "😍🎉";
};

const SalamiWheelApp = () => {
  // --- ROUTING & DERIVED STATE ---
  // We use '?d=' instead of '?token=' to shorten the URL as much as possible statically
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("d");

  let derivedGiverName: string | null = null;
  let derivedMaxAmount: number | null = null;

  if (tokenParam) {
    try {
      const decodedStr = decodeURIComponent(atob(tokenParam));
      const parsedData = JSON.parse(decodedStr);

      if (parsedData.g && parsedData.m) {
        derivedGiverName = parsedData.g;
        derivedMaxAmount = parseFloat(parsedData.m);
      }
    } catch (error) {
      console.error("ইউআরএল টোকেন সঠিক নয় (Invalid Token).");
    }
  }

  const isReceiverMode = derivedGiverName !== null && derivedMaxAmount !== null;

  // --- MUTABLE COMPONENT STATE ---
  const [activeSegments, setActiveSegments] = useState<number[]>([]);

  const [giverInputName, setGiverInputName] = useState<string>("");
  const [maxAmountInput, setMaxAmountInput] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const [receiverName, setReceiverName] = useState<string>("");
  const [isWheelSpinning, setIsWheelSpinning] = useState<boolean>(false);
  const [wheelRotationDegree, setWheelRotationDegree] = useState<number>(0);

  // Modal & Winning State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [winningAmount, setWinningAmount] = useState<number | null>(null);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);

  useEffect(() => {
    if (derivedMaxAmount && activeSegments.length === 0) {
      setActiveSegments(generateWheelSegments(derivedMaxAmount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedMaxAmount]);

  const totalSegments = activeSegments.length;
  const segmentAngle = totalSegments > 0 ? 360 / totalSegments : 0;

  // --- LOGIC: GIVER ---
  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giverInputName.trim() || !maxAmountInput) return;

    const baseUrl = window.location.origin;
    const payload = JSON.stringify({
      g: giverInputName.trim(),
      m: maxAmountInput,
    });
    const secretToken = btoa(encodeURIComponent(payload));
    // Optimized URL parameter name 'd' for Data
    const params = new URLSearchParams({ d: secretToken });

    setGeneratedLink(`${baseUrl}?${params.toString()}`);
  };

  const handleShareLink = async () => {
    if (!generatedLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ঈদের সেলামি চরকা!",
          text: `ঈদ মোবারক! ${giverInputName} তোমার জন্য একটি সিক্রেট সেলামি চরকা পাঠিয়েছে। লিংকে ঢুকে তোমার ভাগ্য পরীক্ষা করো! 🌙✨`,
          url: generatedLink,
        });
        return;
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
    navigator.clipboard.writeText(generatedLink);
    alert("ম্যাজিক লিংক কপি হয়েছে! মেসেঞ্জার বা হোয়াটসঅ্যাপে শেয়ার করো।");
  };

  // --- LOGIC: RECEIVER ---
  const handleSpinWheel = () => {
    if (!receiverName.trim() || isWheelSpinning || totalSegments === 0) return;

    setIsWheelSpinning(true);

    const randomIdx = Math.floor(Math.random() * totalSegments);
    // Increased Extra Spins for suspense (12 full rotations)
    const extraDegrees = 360 * 12;

    const landingAngle = 360 - (randomIdx * segmentAngle + segmentAngle / 2);
    const totalRotation = extraDegrees + landingAngle;

    setWheelRotationDegree((prev) => prev + totalRotation);

    // Increased Timeout to match the longer spin duration (7 seconds)
    setTimeout(() => {
      setIsWheelSpinning(false);
      setWinningAmount(activeSegments[randomIdx]);
      setWinningIndex(randomIdx);
      setShowModal(true);
    }, 7000);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setWheelRotationDegree(0);
  };

  const handleRemoveAmount = () => {
    if (winningIndex !== null) {
      setActiveSegments((prev) => prev.filter((_, i) => i !== winningIndex));
    }
    setShowModal(false);
    setWheelRotationDegree(0);
  };

  const wheelBackground =
    activeSegments.length > 0
      ? `conic-gradient(${activeSegments
          .map((_, i) => {
            const start = i * segmentAngle;
            const end = (i + 1) * segmentAngle;
            const color = i % 2 === 0 ? "#064e3b" : "#047857";
            return `${color} ${start}deg ${end}deg`;
          })
          .join(", ")})`
      : "#0f172a";

  // --- UI RENDERING ---
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;600;800&family=Aref+Ruqaa:wght@700&display=swap');
        
        /* Bengali font primary, Arabic font for Eid headers */
        body { font-family: 'Anek Bangla', sans-serif; }
        .font-eid { font-family: 'Aref Ruqaa', serif; }
        
        .gold-foil-text {
          background: linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* Flower Rain Particle System Engine */
        @keyframes flower-fall {
          0% { transform: translateY(-10vh) rotate(0deg) scale(0.5); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg) scale(1.2); opacity: 0; }
        }
        .flower-particle {
          position: absolute;
          top: -10%;
          z-index: 60;
          pointer-events: none;
          animation: flower-fall linear forwards;
        }
      `,
        }}
      />

      <div
        className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at top right, #0f172a, #020617)",
        }}
      >
        {/* VIEW 1: GIVER CREATE MODE */}
        {!isReceiverMode ? (
          <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 relative overflow-hidden">
            <Moon className="absolute -top-6 -right-6 text-amber-500/10 w-32 h-32" />
            <h1 className="text-4xl font-bold text-center text-amber-400 mb-2 relative z-10 font-eid tracking-wide">
              সেলামি চরকা
            </h1>
            <p className="text-center text-slate-400 mb-8 text-sm relative z-10 leading-relaxed">
              তোমার বাজেট ঠিক করো। আমরা টাকার পরিমাণটি একটি গোপন লিংকে লুকিয়ে
              রাখবো, যাতে সারপ্রাইজ নষ্ট না হয়!
            </p>

            <form
              onSubmit={handleGenerateLink}
              className="space-y-5 relative z-10"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  তোমার নাম (যিনি সেলামি দিচ্ছেন)
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-white transition-all font-medium"
                  placeholder="যেমন: লিমন মামা"
                  value={giverInputName}
                  onChange={(e) => setGiverInputName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  সর্বোচ্চ সেলামি (৳)
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="100000"
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-white transition-all font-medium"
                  placeholder="যেমন: ১০০০"
                  value={maxAmountInput}
                  onChange={(e) => setMaxAmountInput(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-amber-500/20 text-lg"
              >
                গোপন লিংক তৈরি করো
              </button>
            </form>

            {generatedLink && (
              <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-emerald-500/30">
                <p className="text-sm font-semibold text-emerald-400 mb-2">
                  তোমার ম্যাজিক লিংক প্রস্তুত!
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-400 outline-none"
                  />
                  <button
                    onClick={handleShareLink}
                    className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-500 transition-colors shadow-lg"
                    title="শেয়ার করো"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: RECEIVER SPIN MODE */
          <div className="max-w-md w-full flex flex-col items-center">
            <div
              className={`w-full bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 flex flex-col items-center relative overflow-hidden transition-all duration-500 ${showModal ? "blur-sm scale-[0.98]" : ""}`}
            >
              <Star className="absolute top-6 right-6 text-amber-400/20 w-8 h-8" />
              <h1 className="text-3xl font-bold text-center text-amber-400 mb-2 z-10 font-eid">
                সারপ্রাইজ ফ্রম {derivedGiverName}!
              </h1>
              <p className="text-center text-slate-400 mb-8 z-10 text-sm">
                তোমার নাম লিখে চরকা ঘুরিয়ে ঈদের ভাগ্য পরীক্ষা করো 🌙
              </p>

              <div className="w-full mb-8 z-10">
                <input
                  type="text"
                  maxLength={25}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-xl font-bold text-white disabled:opacity-50"
                  placeholder="তোমার নাম লেখো..."
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  disabled={isWheelSpinning || activeSegments.length === 0}
                />
              </div>

              {/* Dynamic Conic Gradient Wheel */}
              <div className="relative w-72 h-72 mb-8 z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />

                {activeSegments.length > 0 ? (
                  <>
                    <div
                      className="w-full h-full rounded-full border-[6px] border-slate-800 overflow-hidden relative shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                      style={{
                        background: wheelBackground,
                        // Smooth easing out for 7 seconds to build tension
                        transition:
                          "transform 7s cubic-bezier(0.1, 0.8, 0.1, 1)",
                        transform: `rotate(${wheelRotationDegree}deg)`,
                      }}
                    >
                      {activeSegments.map((amount, index) => {
                        const rotation =
                          index * segmentAngle + segmentAngle / 2;
                        return (
                          <div
                            key={`${index}-${amount}`}
                            className="absolute top-0 left-1/2 w-8 h-1/2 origin-bottom -translate-x-1/2 flex items-start justify-center pt-5 z-10"
                            style={{ transform: `rotate(${rotation}deg)` }}
                          >
                            <span
                              className="text-amber-400 font-bold text-xs tracking-tighter drop-shadow-md"
                              style={{
                                writingMode: "vertical-rl",
                                transform: "rotate(180deg)",
                              }}
                            >
                              ৳{amount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Clickable Center Pin to trigger spin */}
                    <button
                      onClick={handleSpinWheel}
                      disabled={
                        !receiverName.trim() ||
                        isWheelSpinning ||
                        activeSegments.length === 0
                      }
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full border-4 border-slate-900 z-30 shadow-[0_0_20px_rgba(251,191,36,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-slate-900 font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      স্পিন
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full rounded-full border-[6px] border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 font-bold text-lg">
                    সেলামি শেষ!
                  </div>
                )}
              </div>

              <button
                onClick={handleSpinWheel}
                disabled={
                  !receiverName.trim() ||
                  isWheelSpinning ||
                  activeSegments.length === 0
                }
                className={`w-full font-bold py-3.5 rounded-lg transition-all text-white z-10 text-lg ${!receiverName.trim() || isWheelSpinning || activeSegments.length === 0 ? "bg-slate-700 cursor-not-allowed text-slate-500" : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20"}`}
              >
                {isWheelSpinning
                  ? "ঘুরছে..."
                  : activeSegments.length === 0
                    ? "সব সেলামি শেষ"
                    : "সেলামির জন্য ঘোরাও"}
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full mt-4 bg-transparent border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Gift size={18} className="text-amber-400" />
                নিজে চরকা তৈরি করো
              </button>
            </div>

            {/* --- RESULT POP-UP MODAL WITH FLOWER RAIN --- */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                {/* Custom CSS Flower Rain Injection */}
                {winningAmount !== null &&
                  Array.from({ length: 30 }).map((_, i) => {
                    const flowers = ["🌸", "🌺", "🌼", "✨", "🌙"];
                    const randomFlower =
                      flowers[Math.floor(Math.random() * flowers.length)];
                    const leftPos = Math.random() * 100;
                    const delay = Math.random() * 2;
                    const duration = 2 + Math.random() * 3;
                    return (
                      <div
                        key={i}
                        className="flower-particle text-2xl"
                        style={{
                          left: `${leftPos}%`,
                          animationDelay: `${delay}s`,
                          animationDuration: `${duration}s`,
                        }}
                      >
                        {randomFlower}
                      </div>
                    );
                  })}

                <div className="w-full max-w-sm bg-slate-900 rounded-2xl border-2 border-amber-500/50 shadow-[0_0_50px_rgba(251,191,36,0.15)] p-6 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300 z-50">
                  <Moon
                    className="text-amber-400 w-12 h-12 mb-3 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                    fill="currentColor"
                  />
                  <h2 className="gold-foil-text font-eid text-4xl mb-1 font-bold tracking-wider">
                    অভিনন্দন!
                  </h2>
                  <p className="text-slate-200 text-xl font-bold mb-4 w-full break-words">
                    {receiverName}
                  </p>

                  <div className="w-full bg-slate-950 rounded-xl border border-emerald-500/30 py-6 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-xl"></div>
                    <p className="text-emerald-400/80 text-sm font-semibold uppercase tracking-widest mb-1 relative z-10">
                      তুমি পেয়েছো
                    </p>
                    <div className="gold-foil-text text-5xl font-black relative z-10 drop-shadow-md flex items-center justify-center gap-2">
                      <span className="text-3xl align-top">৳</span>
                      {winningAmount}
                      <span className="text-4xl">
                        {winningAmount !== null && derivedMaxAmount !== null
                          ? getEmojiForAmount(winningAmount, derivedMaxAmount)
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="w-full flex flex-col gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} /> পরিমাণটি রেখে আবার ঘোরাও
                    </button>

                    <button
                      onClick={handleRemoveAmount}
                      className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} /> পরিমাণটি মুছে বন্ধ করো
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SalamiWheelApp;
