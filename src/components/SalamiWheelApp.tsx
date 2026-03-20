"use client";

import React, { useState, useEffect, useRef } from "react";
// Sound effect URLs (replace with your own or royalty-free links if needed)
const SPIN_SOUND_URL =
  "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae3e2.mp3"; // Example spin sound
const CONGRATS_SOUND_URL =
  "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b7bfa.mp3"; // Example congrats sound
import { useSearchParams } from "next/navigation";
import { Share2, Moon, Star, Gift, Trash2, RefreshCw } from "lucide-react";

const generateWheelSegments = (maxAmount: number): number[] => {
  // 20 minimum amounts: .25, .50, .75, ... up to 5.0
  const minSegments = Array.from({ length: 20 }, (_, i) =>
    parseFloat(((i + 1) * 0.25).toFixed(2)),
  );
  // If maxAmount <= 5, just return the minSegments up to maxAmount
  if (maxAmount <= 5) {
    return minSegments.filter((v) => v <= maxAmount);
  }
  // Otherwise, distribute the rest uniformly from 5.25 to maxAmount
  const extraCount = 12; // You can adjust for more/less segments
  const start = 5.25;
  const step = (maxAmount - start) / (extraCount - 1);
  const extraSegments = Array.from({ length: extraCount }, (_, i) =>
    parseFloat((start + i * step).toFixed(2)),
  );
  return [...minSegments, ...extraSegments];
};

const SalamiWheelApp = () => {
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
      console.error("Invalid Token");
    }
  }

  const isReceiverMode = derivedGiverName !== null && derivedMaxAmount !== null;

  const [activeSegments, setActiveSegments] = useState<number[]>([]);
  // Use activeSegments directly for display and spin logic to ensure order matches
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const congratsAudioRef = useRef<HTMLAudioElement | null>(null);
  const [giverInputName, setGiverInputName] = useState<string>("");
  const [maxAmountInput, setMaxAmountInput] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const [receiverName, setReceiverName] = useState<string>("");
  const [isWheelSpinning, setIsWheelSpinning] = useState<boolean>(false);
  const [wheelRotationDegree, setWheelRotationDegree] = useState<number>(0);

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

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giverInputName.trim() || !maxAmountInput) return;

    const baseUrl = window.location.origin;
    // Use a compact payload: no whitespace, short keys, and number for m
    const payload = `{"g":"${giverInputName.trim()}","m":${parseFloat(maxAmountInput)}}`;
    const secretToken = btoa(encodeURIComponent(payload));
    const params = new URLSearchParams({ d: secretToken });
    const longUrl = `${baseUrl}?${params.toString()}`;

    // Try to shorten the link using is.gd API
    try {
      const res = await fetch(
        `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`,
      );
      if (res.ok) {
        const shortUrl = await res.text();
        setGeneratedLink(shortUrl);
        return;
      }
    } catch (err) {
      // fallback to long url
    }
    setGeneratedLink(longUrl);
  };

  const handleShareLink = async () => {
    if (!generatedLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ঈদের সেলামি!",
          text: `ঈদ মোবারক! লিংকে ঢুকে তোমার ভাগ্য পরীক্ষা করো! 🌙✨`,
          url: generatedLink,
        });
        return;
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
    navigator.clipboard.writeText(generatedLink);
    alert("লিংক কপি হয়েছে! মেসেঞ্জার বা হোয়াটসঅ্যাপে শেয়ার করো।");
  };

  const handleSpinWheel = () => {
    if (!receiverName.trim()) {
      alert("আগে তোমার নাম লিখো!");
      return;
    }
    if (isWheelSpinning || totalSegments === 0) return;

    setIsWheelSpinning(true);
    // Play spin sound (handle play errors for autoplay restrictions)
    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      const playPromise = spinAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const resume = () => {
            spinAudioRef.current && spinAudioRef.current.play();
            window.removeEventListener("click", resume);
            window.removeEventListener("touchstart", resume);
          };
          window.addEventListener("click", resume);
          window.addEventListener("touchstart", resume);
        });
      }
    }

    // Weighted random: lower indices (lower amounts) are more likely
    const weights = activeSegments.map((_, i) => totalSegments - i);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const rand = Math.random() * totalWeight;
    let acc = 0;
    let randomIdx = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (rand < acc) {
        randomIdx = i;
        break;
      }
    }
    const landingAngle = 360 - (randomIdx * segmentAngle + segmentAngle / 2);

    // --- BUG FIX: Absolute Rotation Math ---
    // Calculate how many full 360-degree spins we have ALREADY done
    const currentRotations = Math.floor(wheelRotationDegree / 360);
    // Add 15 new extra spins for the 10-second duration
    const targetRotation = (currentRotations + 15) * 360 + landingAngle;

    setWheelRotationDegree(targetRotation);

    // Wait 10 seconds for the new CSS transition to finish
    setTimeout(() => {
      setIsWheelSpinning(false);
      setWinningAmount(activeSegments[randomIdx]);
      setWinningIndex(randomIdx);
      setShowModal(true);
      // Play congrats sound (handle play errors for autoplay restrictions)
      if (congratsAudioRef.current) {
        congratsAudioRef.current.currentTime = 0;
        const playPromise = congratsAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            const resume = () => {
              congratsAudioRef.current && congratsAudioRef.current.play();
              window.removeEventListener("click", resume);
              window.removeEventListener("touchstart", resume);
            };
            window.addEventListener("click", resume);
            window.addEventListener("touchstart", resume);
          });
        }
      }
    }, 10000);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // BUG FIX: Intentionally NOT resetting setWheelRotationDegree(0) here
    // so it doesn't spin backwards!
  };

  const handleRemoveAmount = () => {
    if (winningIndex !== null) {
      setActiveSegments((prev) => prev.filter((_, i) => i !== winningIndex));
    }
    setShowModal(false);
    // BUG FIX: No rotation reset here either.
  };

  // Upgraded Realistic Wheel Colors (Emerald, Bronze, Midnight)
  const themeColors = ["#064e3b", "#92400e", "#020617", "#166534"];
  const wheelBackground =
    activeSegments.length > 0
      ? `conic-gradient(${activeSegments
          .map((_, i) => {
            const start = i * segmentAngle;
            const end = (i + 1) * segmentAngle;
            const color = themeColors[i % themeColors.length];
            return `${color} ${start}deg ${end}deg`;
          })
          .join(", ")})`
      : "#0f172a";

  return (
    <>
      {/* Audio elements for sound effects */}
      <audio ref={spinAudioRef} src={SPIN_SOUND_URL} preload="auto" />
      <audio ref={congratsAudioRef} src={CONGRATS_SOUND_URL} preload="auto" />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;600;800&family=Aref+Ruqaa:wght@700&display=swap');
        
        body { font-family: 'Anek Bangla', sans-serif; }
        .font-eid { font-family: 'Aref Ruqaa', serif; }
        
        .gold-foil-text {
          background: linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .realistic-text-shadow {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9), 0px 0px 2px rgba(0, 0, 0, 1);
        }

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
        className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at top right, #0f172a, #020617)",
        }}
      >
        {!isReceiverMode ? (
          <div className="max-w-sm w-full bg-slate-900 rounded-2xl shadow-2xl p-2 sm:p-8 border border-slate-700 relative overflow-hidden">
            <Moon className="absolute -top-6 -right-6 text-white/10 w-32 h-32" />
            <h1 className="text-2xl sm:text-4xl font-bold text-center text-white mb-2 relative z-10 font-eid tracking-wide">
              <span className="text-3xl sm:text-4xl">সেলামি Wheel</span>
            </h1>
            <p className="text-center text-slate-400 mb-6 sm:mb-8 text-xs sm:text-sm relative z-10 leading-relaxed">
              <span className="text-base sm:text-sm">
                তোমার Highest Amount ঠিক করো।
              </span>
            </p>

            <form
              onSubmit={handleGenerateLink}
              className="space-y-5 relative z-10"
            >
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  তোমার নাম (যিনি সেলামি দিচ্ছেন)
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  className="w-full px-4 py-3 sm:px-4 sm:py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-white outline-none text-white transition-all font-medium text-base sm:text-base"
                  placeholder="যেমন: Kuddus Bhai"
                  value={giverInputName}
                  onChange={(e) => setGiverInputName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  সর্বোচ্চ সেলামি (৳)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100000"
                  className="w-full px-4 py-3 sm:px-4 sm:py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-white outline-none text-white transition-all font-medium text-base sm:text-base"
                  placeholder="যেমন : 500"
                  value={maxAmountInput}
                  onChange={(e) => setMaxAmountInput(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-white to-slate-100 hover:from-white/80 hover:to-slate-100/80 text-slate-900 font-bold py-3.5 sm:py-4 rounded-lg transition-all shadow-lg shadow-white/20 text-lg sm:text-xl"
              >
                লিংক তৈরি করো
              </button>
            </form>

            {generatedLink && (
              <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-emerald-500/30">
                <p className="text-sm font-semibold text-emerald-400 mb-2">
                  লিংক প্রস্তুত!
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
                    title="শেয়ার করো"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md w-full flex flex-col items-center px-1 sm:px-0">
            <div
              className={`w-full bg-slate-900 rounded-2xl shadow-2xl p-2 sm:p-8 border border-slate-700 flex flex-col items-center relative overflow-hidden transition-all duration-500 ${showModal ? "blur-sm scale-[0.98]" : ""}`}
            >
              <Star className="absolute top-6 right-6 text-white/20 w-8 h-8" />
              <h1 className="text-xl sm:text-3xl font-bold text-center text-white mb-2 z-10 font-eid">
                <span className="text-2xl sm:text-3xl">
                  সেলামি from {derivedGiverName}!
                </span>
              </h1>
              <p className="text-center text-slate-400 mb-6 sm:mb-8 z-10 text-xs sm:text-sm">
                <span className="text-base sm:text-sm">
                  তোমার নাম লিখে Wheel ঘুরিয়ে ঈদের ভাগ্য পরীক্ষা করো 🌙
                </span>
              </p>

              <div className="w-full mb-6 sm:mb-8 z-10">
                <input
                  type="text"
                  maxLength={25}
                  className="w-full px-4 py-3 sm:px-4 sm:py-3 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-lg sm:text-xl font-bold text-white disabled:opacity-50"
                  placeholder="তোমার নাম লেখো..."
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  disabled={isWheelSpinning || activeSegments.length === 0}
                />
              </div>

              <div className="relative w-72 h-72 sm:w-96 sm:h-96 mb-6 sm:mb-8 z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[18px] border-r-[18px] border-t-[36px] sm:border-l-[14px] sm:border-r-[14px] sm:border-t-[28px] border-l-transparent border-r-transparent border-t-[#b91c1c] drop-shadow-[0_4px_6px_rgba(185,28,28,0.8)]" />

                {activeSegments.length > 0 ? (
                  <>
                    <div
                      className="w-full h-full rounded-full border-[16px] border-slate-800 overflow-hidden relative shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_0_80px_rgba(16,185,129,0.2)]"
                      style={{
                        background: wheelBackground,
                        // Increased to 10 seconds with a realistic ease-out curve
                        transition:
                          "transform 10s cubic-bezier(0.1, 0.85, 0.1, 1)",
                        transform: `rotate(${wheelRotationDegree}deg)`,
                      }}
                    >
                      {activeSegments.map((amount, index) => {
                        const rotation =
                          index * segmentAngle + segmentAngle / 2;
                        return (
                          <div
                            key={`${index}-${amount}`}
                            className="absolute top-0 left-1/2 w-14 h-1/2 origin-bottom -translate-x-1/2 flex items-start justify-center pt-8 z-10"
                            style={{ transform: `rotate(${rotation}deg)` }}
                          >
                            <span
                              className="text-slate-100 font-bold text-base sm:text-lg tracking-widest realistic-text-shadow"
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
                    <button
                      onClick={handleSpinWheel}
                      disabled={
                        !receiverName.trim() ||
                        isWheelSpinning ||
                        activeSegments.length === 0
                      }
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white to-slate-100 rounded-full border-[6px] border-slate-900 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.8)] cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-slate-900 font-black text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      স্পিন
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full rounded-full border-[8px] border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 font-bold text-lg shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                    <span className="text-lg sm:text-xl">সেলামি শেষ!</span>
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
                className={`w-full font-bold py-3.5 sm:py-4 rounded-lg transition-all text-white z-10 text-lg sm:text-xl ${!receiverName.trim() || isWheelSpinning || activeSegments.length === 0 ? "bg-slate-700 cursor-not-allowed text-slate-500" : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20"}`}
              >
                {isWheelSpinning
                  ? "ঘুরছে..."
                  : activeSegments.length === 0
                    ? "সব সেলামি শেষ"
                    : "সেলামির জন্য ঘোরাও"}
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full mt-3 sm:mt-4 bg-transparent border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-semibold py-3 px-4 sm:py-4 sm:px-5 rounded-lg transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                <Gift size={18} className="text-white" />
                নিজে তৈরি করো
              </button>
            </div>

            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
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

                <div className="w-full max-w-sm bg-slate-900 rounded-2xl border-2 border-white/50 shadow-[0_0_50px_rgba(255,255,255,0.15)] p-6 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300 z-50">
                  <Moon
                    className="text-white w-16 h-16 mb-4 drop-shadow-[0_0_18px_rgba(255,255,255,0.5)]"
                    fill="currentColor"
                  />
                  <h2 className="gold-foil-text font-eid text-5xl mb-2 font-bold tracking-wider">
                    অভিনন্দন!
                  </h2>
                  <p className="text-slate-200 text-2xl font-bold mb-5 w-full break-words">
                    {receiverName}
                  </p>

                  <div className="w-full bg-slate-950 rounded-xl border border-emerald-500/30 py-8 mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-xl"></div>
                    <p className="text-emerald-400/80 text-lg font-semibold uppercase tracking-widest mb-2 relative z-10">
                      তোমার জন্য সেলামি
                    </p>
                    <div className="gold-foil-text text-6xl font-black relative z-10 drop-shadow-md flex items-center justify-center gap-2">
                      <span className="text-4xl align-top">৳</span>
                      {winningAmount}
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
