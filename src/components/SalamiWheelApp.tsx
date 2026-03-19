"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Share2, Moon, Star, Gift, X, Trash2, RefreshCw } from "lucide-react";

/**
 * Generates the initial 12-segment distribution array based on the maximum amount.
 */
const generateWheelSegments = (maxAmount: number): number[] => {
  return [
    maxAmount,
    Math.floor(maxAmount * 0.1),
    Math.floor(maxAmount * 0.4),
    10,
    Math.floor(maxAmount * 0.25),
    Math.floor(maxAmount * 0.75),
    0,
    Math.floor(maxAmount * 0.15),
    Math.floor(maxAmount * 0.5),
    50,
    Math.floor(maxAmount * 0.3),
    Math.floor(maxAmount * 0.8),
  ];
};

const SalamiWheelApp = () => {
  // --- ROUTING & DERIVED STATE ---
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  let derivedGiverName: string | null = null;
  let derivedMaxAmount: number | null = null;

  if (tokenParam) {
    try {
      const decodedStr = decodeURIComponent(atob(tokenParam));
      const parsedData = JSON.parse(decodedStr);

      if (parsedData.g && parsedData.m) {
        derivedGiverName = parsedData.g;
        derivedMaxAmount = parseInt(parsedData.m, 10);
      }
    } catch (error) {
      console.error("Invalid or corrupted token provided in URL.");
    }
  }

  const isReceiverMode = derivedGiverName !== null && derivedMaxAmount !== null;

  // --- MUTABLE COMPONENT STATE ---
  // We store the wheel segments in state so we can remove them later
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

  // Initialize segments once when the URL is decoded
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
    const params = new URLSearchParams({ token: secretToken });

    setGeneratedLink(`${baseUrl}?${params.toString()}`);
  };

  const handleShareLink = async () => {
    if (!generatedLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Spin for Eid Salami!",
          text: `Eid Mubarak! ${giverInputName} has sent you a surprise Eid Salami wheel. Test your luck! 🌙✨`,
          url: generatedLink,
        });
        return;
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
    navigator.clipboard.writeText(generatedLink);
    alert("Magic Link copied! Share it securely via Messenger or WhatsApp.");
  };

  // --- LOGIC: RECEIVER ---
  const handleSpinWheel = () => {
    if (!receiverName.trim() || isWheelSpinning || totalSegments === 0) return;

    setIsWheelSpinning(true);

    // Pick a random winner
    const randomIdx = Math.floor(Math.random() * totalSegments);
    const extraDegrees = 360 * 6;

    // Calculate exact landing angle for the pointer
    const landingAngle = 360 - (randomIdx * segmentAngle + segmentAngle / 2);
    const totalRotation = extraDegrees + landingAngle;

    setWheelRotationDegree((prev) => prev + totalRotation);

    // Wait for CSS animation to finish
    setTimeout(() => {
      setIsWheelSpinning(false);
      setWinningAmount(activeSegments[randomIdx]);
      setWinningIndex(randomIdx);
      setShowModal(true); // Trigger the pop-up modal
    }, 4000);
  };

  // Modal Actions
  const handleCloseModal = () => {
    setShowModal(false);
    // Reset wheel visually for the next spin without removing the amount
    setWheelRotationDegree(0);
  };

  const handleRemoveAmount = () => {
    if (winningIndex !== null) {
      // Filter out the specific index that was won
      setActiveSegments((prev) => prev.filter((_, i) => i !== winningIndex));
    }
    setShowModal(false);
    setWheelRotationDegree(0);
  };

  // --- DYNAMIC CSS GENERATION ---
  // This builds the conic-gradient string based on whatever segments are left
  const wheelBackground =
    activeSegments.length > 0
      ? `conic-gradient(${activeSegments
          .map((_, i) => {
            const start = i * segmentAngle;
            const end = (i + 1) * segmentAngle;
            const color = i % 2 === 0 ? "#064e3b" : "#047857"; // Alternating Emerald colors
            return `${color} ${start}deg ${end}deg`;
          })
          .join(", ")})`
      : "#0f172a"; // Fallback if empty

  // --- UI RENDERING ---
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap');
        .font-eid { font-family: 'Aref Ruqaa', serif; }
        .gold-foil-text {
          background: linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `,
        }}
      />

      <div
        className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4"
        style={{
          backgroundImage:
            "radial-gradient(circle at top right, #0f172a, #020617)",
        }}
      >
        {/* VIEW 1: GIVER CREATE MODE */}
        {!isReceiverMode ? (
          <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 relative overflow-hidden">
            <Moon className="absolute -top-6 -right-6 text-amber-500/10 w-32 h-32" />
            <h1 className="text-4xl font-bold text-center text-amber-400 mb-2 relative z-10 font-eid">
              Secret Salami Wheel
            </h1>
            <p className="text-center text-slate-400 mb-8 text-sm relative z-10">
              Set your budget. We will hide the amount in a secret link so it
              stays a surprise!
            </p>

            <form
              onSubmit={handleGenerateLink}
              className="space-y-5 relative z-10"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-white transition-all"
                  placeholder="e.g. Uncle Limon"
                  value={giverInputName}
                  onChange={(e) => setGiverInputName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Max Salami Amount (৳)
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="100000"
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-white transition-all"
                  placeholder="e.g. 1000"
                  value={maxAmountInput}
                  onChange={(e) => setMaxAmountInput(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-amber-500/20"
              >
                Generate Secret Link
              </button>
            </form>

            {generatedLink && (
              <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-emerald-500/30">
                <p className="text-sm font-semibold text-emerald-400 mb-2">
                  Secret Link Ready!
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
            {/* The Main Wheel Interface */}
            <div
              className={`w-full bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 flex flex-col items-center relative overflow-hidden transition-all duration-500 ${showModal ? "blur-sm scale-[0.98]" : ""}`}
            >
              <Star className="absolute top-6 right-6 text-amber-400/20 w-8 h-8" />
              <h1 className="text-3xl font-bold text-center text-amber-400 mb-2 z-10 font-eid">
                Surprise from {derivedGiverName}!
              </h1>
              <p className="text-center text-slate-400 mb-8 z-10 text-sm">
                Enter your name to see what you get 🌙
              </p>

              <div className="w-full mb-8 z-10">
                <input
                  type="text"
                  maxLength={25}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-lg text-white disabled:opacity-50"
                  placeholder="Enter your name..."
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  disabled={isWheelSpinning || activeSegments.length === 0}
                />
              </div>

              {/* Dynamic Conic Gradient Wheel */}
              <div className="relative w-72 h-72 mb-8 z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />

                {activeSegments.length > 0 ? (
                  <div
                    className="w-full h-full rounded-full border-[6px] border-slate-800 overflow-hidden relative shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                    style={{
                      background: wheelBackground,
                      transition:
                        "transform 4s cubic-bezier(0.12, 0.8, 0.15, 1)",
                      transform: `rotate(${wheelRotationDegree}deg)`,
                    }}
                  >
                    {activeSegments.map((amount, index) => {
                      // Position text exactly in the middle of each segment
                      const rotation = index * segmentAngle + segmentAngle / 2;
                      return (
                        <div
                          key={`${index}-${amount}`}
                          className="absolute top-0 left-1/2 w-8 h-1/2 origin-bottom -translate-x-1/2 flex items-start justify-center pt-6 z-10"
                          style={{ transform: `rotate(${rotation}deg)` }}
                        >
                          <span
                            className="text-amber-400 font-bold text-sm tracking-tighter drop-shadow-md"
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
                    {/* Center Pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-amber-400 rounded-full border-4 border-slate-900 z-20 shadow-xl"></div>
                  </div>
                ) : (
                  // Empty State if all segments are removed
                  <div className="w-full h-full rounded-full border-[6px] border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 font-bold">
                    WHEEL EMPTY
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
                className={`w-full font-bold py-3.5 rounded-lg transition-all text-white z-10 ${!receiverName.trim() || isWheelSpinning || activeSegments.length === 0 ? "bg-slate-700 cursor-not-allowed text-slate-500" : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20"}`}
              >
                {isWheelSpinning
                  ? "SPINNING..."
                  : activeSegments.length === 0
                    ? "NO MORE SALAMI"
                    : "SPIN FOR SALAMI"}
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full mt-4 bg-transparent border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Gift size={18} className="text-amber-400" />
                Create Your Own Salami Link
              </button>
            </div>

            {/* --- RESULT POP-UP MODAL --- */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="w-full max-w-sm bg-slate-900 rounded-2xl border-2 border-amber-500/50 shadow-[0_0_50px_rgba(251,191,36,0.15)] p-6 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                  {/* Decorative Header */}
                  <Moon
                    className="text-amber-400 w-12 h-12 mb-3 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                    fill="currentColor"
                  />
                  <h2 className="gold-foil-text font-eid text-4xl mb-1 font-bold tracking-wider">
                    Congratulations!
                  </h2>
                  <p className="text-slate-200 text-lg font-bold mb-4 w-full break-words">
                    {receiverName}
                  </p>

                  {/* Prize Display */}
                  <div className="w-full bg-slate-950 rounded-xl border border-emerald-500/30 py-6 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-xl"></div>
                    <p className="text-emerald-400/80 text-xs font-medium uppercase tracking-widest mb-1 relative z-10">
                      You won
                    </p>
                    <div className="gold-foil-text text-6xl font-black relative z-10 drop-shadow-md">
                      <span className="text-3xl align-top mr-1">৳</span>
                      {winningAmount}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full flex flex-col gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} /> Keep Amount & Spin Again
                    </button>

                    <button
                      onClick={handleRemoveAmount}
                      className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} /> Remove Amount & Close
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
