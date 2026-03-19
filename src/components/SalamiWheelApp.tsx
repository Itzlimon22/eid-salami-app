"use client";

import React, { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { Share2, Copy, Download, RefreshCw } from "lucide-react";

/**
 * Props for the SalamiWheelApp component
 */
interface SalamiWheelAppProps {
  initialGiverName: string | null;
  initialMaxAmount: number | null;
}

/**
 * Main Client Component handling both Giver creation and Receiver spinning logic.
 */
const SalamiWheelApp = ({
  initialGiverName,
  initialMaxAmount,
}: SalamiWheelAppProps) => {
  // --- STATE MANAGEMENT ---
  const isReceiverMode = initialGiverName !== null && initialMaxAmount !== null;

  // Giver State
  const [giverInputName, setGiverInputName] = useState<string>("");
  const [maxAmountInput, setMaxAmountInput] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Receiver State
  const [receiverName, setReceiverName] = useState<string>("");
  const [isWheelSpinning, setIsWheelSpinning] = useState<boolean>(false);
  const [wheelRotationDegree, setWheelRotationDegree] = useState<number>(0);
  const [winningAmount, setWinningAmount] = useState<number | null>(null);
  const [hasSpun, setHasSpun] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Wheel Configuration
  const wheelSegments = initialMaxAmount
    ? [
        0,
        Math.floor(initialMaxAmount * 0.1),
        Math.floor(initialMaxAmount * 0.5),
        initialMaxAmount,
        Math.floor(initialMaxAmount * 0.25),
        10,
      ]
    : [];
  const segmentAngle = 360 / wheelSegments.length;

  // --- LOGIC: GIVER ---

  /**
   * Generates the unique shareable link based on giver inputs.
   */
  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giverInputName.trim() || !maxAmountInput) return; // Early return for invalid input

    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      giver: giverInputName.trim(),
      max: maxAmountInput,
    });

    setGeneratedLink(`${baseUrl}?${params.toString()}`);
  };

  /**
   * Attempts to use native Web Share API, falls back to copying to clipboard.
   */
  const handleShareLink = async () => {
    if (!generatedLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Spin for Eid Salami!",
          text: `${giverInputName} has created a custom Eid Salami wheel for you! Spin to see what you get.`,
          url: generatedLink,
        });
        return; // Early return on successful native share
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }

    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(generatedLink);
    alert("Link copied to clipboard! Share it in Messenger or Instagram.");
  };

  // --- LOGIC: RECEIVER ---

  /**
   * Handles the physics and logic of spinning the wheel.
   */
  const handleSpinWheel = () => {
    if (!receiverName.trim() || isWheelSpinning || hasSpun) return;

    setIsWheelSpinning(true);

    // Calculate random spin (minimum 5 full rotations + random segment)
    const randomSegmentIndex = Math.floor(Math.random() * wheelSegments.length);
    const extraDegrees = 360 * 5; // 5 full spins for visual effect
    const landingAngle = randomSegmentIndex * segmentAngle + segmentAngle / 2; // Center of segment
    const totalRotation = extraDegrees + (360 - landingAngle); // CSS rotates clockwise

    setWheelRotationDegree((prev) => prev + totalRotation);

    // Wait for CSS transition to finish (3 seconds) before showing result
    setTimeout(() => {
      setIsWheelSpinning(false);
      setWinningAmount(wheelSegments[randomSegmentIndex]);
      setHasSpun(true);
    }, 3000);
  };

  /**
   * Converts the result card DOM node to a PNG and triggers download.
   */
  const handleDownloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `Eid-Salami-${receiverName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Could not download image. Please try again.");
    }
  };

  // --- UI RENDERING ---

  // VIEW 1: Giver creates the wheel
  if (!isReceiverMode) {
    return (
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
        <h1 className="text-3xl font-bold text-center text-emerald-600 mb-6">
          Create Salami Wheel
        </h1>
        <p className="text-center text-emerald-800 mb-6">
          Set your max budget and share the link with friends & family!
        </p>

        <form onSubmit={handleGenerateLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. Uncle Limon"
              value={giverInputName}
              onChange={(e) => setGiverInputName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">
              Maximum Salami Amount (৳)
            </label>
            <input
              type="number"
              required
              min="10"
              className="w-full px-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. 1000"
              value={maxAmountInput}
              onChange={(e) => setMaxAmountInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Generate Magic Link
          </button>
        </form>

        {generatedLink && (
          <div className="mt-8 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm font-semibold text-emerald-800 mb-2">
              Your Unique Link is Ready!
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded text-sm text-gray-600"
              />
              <button
                onClick={handleShareLink}
                className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 transition-colors flex items-center justify-center"
                title="Share or Copy Link"
              >
                <Share2 size={20} />
              </button>
            </div>
            <div className="flex gap-2 justify-center">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                title="Share on Facebook"
              >
                Facebook
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent("Spin for Eid Salami! " + generatedLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                title="Share on WhatsApp"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.messenger.com/share?link=${encodeURIComponent(generatedLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                title="Share on Messenger"
              >
                Messenger
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: Receiver spins the wheel
  return (
    <div className="max-w-md w-full flex flex-col items-center">
      {!hasSpun ? (
        <div className="w-full bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-center text-emerald-600 mb-2">
            Eid Salami from {initialGiverName}!
          </h1>
          <p className="text-center text-emerald-800 mb-8">
            Enter your name and test your luck.
          </p>

          {!isWheelSpinning && receiverName === "" && (
            <div className="w-full mb-6">
              <input
                type="text"
                className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-lg"
                placeholder="Enter your name to spin..."
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
              />
            </div>
          )}

          {/* SVG Wheel Implementation */}
          <div className="relative w-64 h-64 mb-8">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-md" />

            {/* The Wheel */}
            <div
              className="w-full h-full rounded-full border-4 border-emerald-800 overflow-hidden relative shadow-inner"
              style={{
                transition: "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)",
                transform: `rotate(${wheelRotationDegree}deg)`,
              }}
            >
              {wheelSegments.map((amount, index) => {
                const rotation = index * segmentAngle;
                const color = index % 2 === 0 ? "#10b981" : "#34d399"; // Alternating emerald colors
                return (
                  <div
                    key={index}
                    className="absolute w-full h-full origin-center"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    {/* Segment slice using conic gradient approach clipped to half */}
                    <div
                      className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
                      style={{
                        backgroundColor: color,
                        transform: `skewY(${90 - segmentAngle}deg)`,
                      }}
                    />
                    {/* Amount Text */}
                    <div
                      className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-bold text-lg z-10 origin-bottom"
                      style={{ transform: `rotate(${segmentAngle / 2}deg)` }}
                    >
                      ৳{amount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSpinWheel}
            disabled={!receiverName.trim() || isWheelSpinning}
            className={`w-full font-bold py-3 rounded-lg transition-colors text-white ${!receiverName.trim() || isWheelSpinning ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {isWheelSpinning ? "Spinning..." : "SPIN FOR SALAMI"}
          </button>
        </div>
      ) : (
        // RESULT CARD VIEW
        <div className="w-full flex flex-col items-center gap-6">
          {/* Card to be downloaded */}
          <div
            ref={cardRef}
            className="w-full aspect-[3/4] bg-emerald-800 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-8 text-center shadow-2xl border-4 border-yellow-400"
            style={{
              backgroundImage:
                "linear-gradient(to bottom right, #064e3b, #047857)",
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 text-yellow-400 opacity-50 text-4xl">
              ☪
            </div>
            <div className="absolute bottom-4 right-4 text-yellow-400 opacity-50 text-4xl">
              ★
            </div>

            <h2 className="text-yellow-400 font-serif text-3xl mb-2 font-bold tracking-widest">
              EID MUBARAK
            </h2>
            <div className="w-16 h-1 bg-yellow-400 mb-8 rounded"></div>

            <p className="text-emerald-100 text-lg mb-1">Congratulations</p>
            <p className="text-white text-3xl font-bold mb-8">{receiverName}</p>

            <p className="text-emerald-100 mb-2">You won</p>
            <div className="bg-yellow-400 text-emerald-900 text-5xl font-black py-4 px-8 rounded-lg shadow-lg mb-8">
              ৳{winningAmount}
            </div>

            <p className="text-emerald-200 text-sm mt-auto italic">
              Sent with love from {initialGiverName}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full gap-4">
            <button
              onClick={handleDownloadCard}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} /> Download Card
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-none bg-gray-200 hover:bg-gray-300 text-emerald-900 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalamiWheelApp;
