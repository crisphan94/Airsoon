import { CheckCircle, XCircle, Loader } from "lucide-react";
interface SwapOperation {
  from: string;
  to: string;
  status: "pending" | "completed" | "failed";
}
interface SwapResult {
  key: string;
  swaps: SwapOperation[];
}
interface TokenSwapStatusProps {
  isSwapping: boolean;
  results: SwapResult[];
  onReset: () => void;
}
export function TokenSwapStatus({
  isSwapping,
  results,
  onReset,
}: TokenSwapStatusProps) {
  const getTokenIcon = (token: string) => {
    switch (token) {
      case "ETH":
        return "◆";
      // Diamond symbol for ETH
      case "BTC":
        return "₿";
      // Bitcoin symbol
      case "USDT":
        return "💲";
      // Dollar symbol for USDT
      default:
        return "🪙";
      // Generic coin
    }
  };
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">
        {isSwapping ? "Swapping Tokens..." : "Swap Results"}
      </h2>
      {isSwapping && (
        <div className="flex justify-center my-8">
          <Loader className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      )}
      {!isSwapping && results.length > 0 && (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">Private Key {result.key}</h3>
              <div className="space-y-2">
                {result.swaps.map((swap, swapIndex) => (
                  <div
                    key={swapIndex}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTokenIcon(swap.from)}</span>
                      <span>{swap.from}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-lg">{getTokenIcon(swap.to)}</span>
                      <span>{swap.to}</span>
                    </div>
                    <div>
                      {swap.status === "completed" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {swap.status === "failed" && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      {swap.status === "pending" && (
                        <Loader className="w-5 h-5 text-yellow-500 animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {!isSwapping && (
        <button
          onClick={onReset}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          New Swap
        </button>
      )}
    </div>
  );
}
