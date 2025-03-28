import React, { useState } from "react";
interface TokenSwapFormProps {
  onStartSwap: (privateKeys: string[], swapsPerKey: string) => void;
}
export function TokenSwapForm({ onStartSwap }: TokenSwapFormProps) {
  const [privateKeys, setPrivateKeys] = useState("");
  const [swapsPerKey, setSwapsPerKey] = useState("1");
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation
    if (!privateKeys.trim()) {
      setError("Please enter at least one private key");
      return;
    }
    if (parseInt(swapsPerKey) < 1) {
      setError("Number of swaps must be at least 1");
      return;
    }
    const keys = privateKeys
      .split("\n")
      .map((key) => key.trim())
      .filter((key) => key.length > 0);
    if (keys.length === 0) {
      setError("Please enter at least one valid private key");
      return;
    }
    setError("");
    onStartSwap(keys, swapsPerKey);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-lg font-semibold">Private Keys</label>
        <div className="relative">
          <textarea
            className="w-full h-40 p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter one private key per line..."
            value={privateKeys}
            onChange={(e) => setPrivateKeys(e.target.value)}
            required
          />
        </div>
        <p className="text-xs text-gray-500">
          Private keys are stored locally and never sent to any server.
        </p>
      </div>
      <div className="space-y-2">
        <label className="block text-lg font-semibold">Swaps Per Key</label>
        <input
          type="number"
          className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Number of swaps"
          min="1"
          value={swapsPerKey}
          onChange={(e) => setSwapsPerKey(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-lg font-semibold">Network</label>
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
          <p className="font-medium">https://evmrpc-testnet.0g.ai</p>
        </div>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
      >
        Start Swap
      </button>
    </form>
  );
}
