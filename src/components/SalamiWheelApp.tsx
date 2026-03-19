"use client";

import React, { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import { Share2, Download, RefreshCw, Moon, Star, Gift } from "lucide-react";

/**
 * Generates a dynamic 12-segment distribution array based on the maximum amount.
 * @param maxAmount - The highest possible salami amount set by the giver.
 * @returns An array of 12 integers representing the wheel slices.
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

/**
 * Main Client Component: Highly-themed Eid al-Fitr Salami Wheel
 * Utilizes Derived State to parse URL parameters safely without cascading renders.
 */
const SalamiWheelApp = () => {
  // --- ROUTING & DERIVED STATE ---
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  let initialGiverName: string | null = null;
  let initialMaxAmount: number | null = null;

  // Derive data directly from the URL parameter on render, avoiding useEffect
  if (tokenParam) {
    try {
      const decodedStr = decodeURIComponent(atob(tokenParam));
      const parsedData = JSON.parse(decodedStr);

      if (parsedData.g && parsedData.m) {
        initialGiverName = parsedData.g;
        initialMaxAmount = parseInt(parsedData.m, 10);
      }
    } catch (error) {
      console.error("Invalid or corrupted token provided in URL.");
    }
  }

  const isReceiverMode = initialGiverName !== null && initialMaxAmount !== null;
  const wheelSegments = initialMaxAmount
    ? generateWheelSegments(initialMaxAmount)
    : [];
  const totalSegments = wheelSegments.length;
  const segmentAngle = totalSegments > 0 ? 360 / totalSegments : 0;

  // --- COMPONENT STATE ---
  const [giverInputName, setGiverInputName] = useState<string>("");
  const [maxAmountInput, setMaxAmountInput] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const [receiverName, setReceiverName] = useState<string>("");
  const [isWheelSpinning, setIsWheelSpinning] = useState<boolean>(false);
  const [wheelRotationDegree, setWheelRotationDegree] = useState<number>(0);
  const [winningAmount, setWinningAmount] = useState<number | null>(null);
  const [hasSpun, setHasSpun] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // --- LOGIC: GIVER ---
  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giverInputName.trim() || !maxAmountInput) return;

    const baseUrl = window.location.origin;
    const payload = JSON.stringify({
      g: giverInputName.trim(),
      m: maxAmountInput,
    });

    // Unicode-safe Base64 encoding
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
    if (
      !receiverName.trim() ||
      isWheelSpinning ||
      hasSpun ||
      totalSegments === 0
    )
      return;

    setIsWheelSpinning(true);
    const randomSegmentIndex = Math.floor(Math.random() * totalSegments);
    const extraDegrees = 360 * 6;
    const landingAngle =
      360 - (randomSegmentIndex * segmentAngle + segmentAngle / 2);
    const totalRotation = extraDegrees + landingAngle;

    setWheelRotationDegree((prev) => prev + totalRotation);

    setTimeout(() => {
      setIsWheelSpinning(false);
      setWinningAmount(wheelSegments[randomSegmentIndex]);
      setHasSpun(true);
    }, 4000);
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 1.0,
        pixelRatio: 3,
      });
      const link = document.createElement("a");
      link.download = `Eid-Salami-${receiverName.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Could not download image. Please try again.");
    }
  };

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
            {!hasSpun ? (
              <div className="w-full bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 flex flex-col items-center relative overflow-hidden">
                <Star className="absolute top-6 right-6 text-amber-400/20 w-8 h-8" />
                <h1 className="text-3xl font-bold text-center text-amber-400 mb-2 z-10 font-eid">
                  Surprise from {initialGiverName}!
                </h1>
                <p className="text-center text-slate-400 mb-8 z-10 text-sm">
                  Enter your name to see what you get 🌙
                </p>

                {!isWheelSpinning && receiverName === "" && (
                  <div className="w-full mb-8 z-10">
                    <input
                      type="text"
                      maxLength={25}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-lg text-white"
                      placeholder="Enter your name..."
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                    />
                  </div>
                )}

                <div className="relative w-72 h-72 mb-8 z-10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                  <div
                    className="w-full h-full rounded-full border-[6px] border-slate-800 overflow-hidden relative shadow-[0_0_40px_rgba(16,185,129,0.2)] bg-slate-900"
                    style={{
                      transition:
                        "transform 4s cubic-bezier(0.12, 0.8, 0.15, 1)",
                      transform: `rotate(${wheelRotationDegree}deg)`,
                    }}
                  >
                    {wheelSegments.map((amount, index) => {
                      const rotation = index * segmentAngle;
                      const color = index % 2 === 0 ? "#064e3b" : "#047857";
                      return (
                        <div
                          key={index}
                          className="absolute top-0 left-0 w-full h-full"
                          style={{
                            clipPath:
                              "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 50%)",
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: "50% 50%",
                          }}
                        >
                          <div
                            className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
                            style={{
                              backgroundColor: color,
                              transform: `skewY(${90 - segmentAngle}deg)`,
                            }}
                          />
                          <div
                            className="absolute top-0 left-1/2 w-8 h-1/2 origin-bottom -translate-x-1/2 flex items-start justify-center pt-6 z-10"
                            style={{
                              transform: `rotate(${segmentAngle / 2}deg)`,
                            }}
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
                        </div>
                      );
                    })}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-amber-400 rounded-full border-4 border-slate-900 z-20 shadow-xl"></div>
                  </div>
                </div>

                <button
                  onClick={handleSpinWheel}
                  disabled={!receiverName.trim() || isWheelSpinning}
                  className={`w-full font-bold py-3.5 rounded-lg transition-all text-white z-10 ${!receiverName.trim() || isWheelSpinning ? "bg-slate-700 cursor-not-allowed text-slate-500" : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20"}`}
                >
                  {isWheelSpinning ? "SPINNING..." : "SPIN FOR SALAMI"}
                </button>

                {!isWheelSpinning && (
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="mt-6 text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-4 z-10"
                  >
                    Want to create your own Salami Wheel?
                  </button>
                )}
              </div>
            ) : (
              /* --- PREMIUM EID CARD VIEW --- */
              <div className="w-full flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
                <div
                  ref={cardRef}
                  className="w-full aspect-[3/4] rounded-xl relative overflow-hidden flex flex-col items-center justify-between py-12 px-6 text-center shadow-2xl border-[8px] border-slate-900 ring-2 ring-amber-500/50"
                  style={{
                    backgroundColor: "#020617",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), radial-gradient(circle at center, #0f172a 0%, #020617 100%)`,
                  }}
                >
                  <div className="absolute inset-3 border border-amber-500/30 rounded-lg pointer-events-none"></div>
                  <div className="absolute inset-4 border border-amber-500/10 rounded-lg pointer-events-none"></div>

                  <div className="z-10 flex flex-col items-center w-full mt-2">
                    <Moon
                      className="text-amber-400 w-10 h-10 mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                      fill="currentColor"
                    />
                    <h2 className="gold-foil-text font-eid text-5xl mb-2 font-bold tracking-widest uppercase">
                      Eid Mubarak
                    </h2>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mb-8"></div>

                    <p className="text-amber-200/60 text-xs mb-2 uppercase tracking-[0.3em]">
                      Presented To
                    </p>
                    <p className="text-slate-100 text-3xl font-bold w-full break-words whitespace-normal px-4 line-clamp-2 leading-tight">
                      {receiverName}
                    </p>
                  </div>

                  <div className="z-10 flex flex-col items-center w-full relative my-6">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full"></div>
                    <p className="text-emerald-300/80 text-sm mb-3 font-medium tracking-wide z-10">
                      You have received
                    </p>
                    <div className="relative z-10 bg-slate-900/80 backdrop-blur-sm border border-amber-500/30 py-6 w-full rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                      <div className="gold-foil-text text-7xl font-black drop-shadow-lg">
                        <span className="text-4xl align-top mr-1">৳</span>
                        {winningAmount}
                      </div>
                    </div>
                  </div>

                  <div className="z-10 mt-auto mb-2">
                    <p className="text-amber-200/60 text-sm italic font-serif">
                      Sent with love from
                    </p>
                    <p className="gold-foil-text font-bold mt-1 text-xl">
                      {initialGiverName}
                    </p>
                  </div>
                </div>

                <div className="flex w-full gap-3 mt-2">
                  <button
                    onClick={handleDownloadCard}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Download size={20} /> Save Premium Card
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-none bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold py-3.5 px-4 rounded-lg transition-all flex items-center justify-center"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>

                <button
                  onClick={() => (window.location.href = "/")}
                  className="w-full mt-1 bg-transparent border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Gift size={18} className="text-amber-400" />
                  Create Your Own Salami Link
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SalamiWheelApp;
