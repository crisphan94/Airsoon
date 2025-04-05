import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { ethers } from "ethers";
import useFilteredAccounts from "../hooks/useFilteredAccounts";

const RPC_URL = "https://evmrpc-testnet.0g.ai";
const SWAP_ROUTER_ADDRESS = "0xE233D75Ce6f04C04610947188DEC7C55790beF3b";

const tokenOptions = [
  { name: "USDT", value: "0x9A87C2412d500343c073E5Ae5394E3bE3874F76b" },
  { name: "ETH", value: "0xce830D0905e0f7A9b300401729761579c5FB6bd6" },
  { name: "BTC", value: "0x1E0D871472973c562650E991ED8006549F8CBEfc" },
];

const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
];

type FormValues = {
  amount: string;
  repeat: number;
  tokenIn: string;
  tokenOut: string;
};

const OGLabs: React.FC = () => {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      amount: "100",
      repeat: 20,
      tokenIn: "0x9A87C2412d500343c073E5Ae5394E3bE3874F76b",
      tokenOut: "0xce830D0905e0f7A9b300401729761579c5FB6bd6",
    },
  });

  const accounts = useFilteredAccounts();

  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (accounts.length === 0) {
    return <>No wallets</>;
  }

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const swapTokens = async ({
    tokenIn,
    tokenOut,
    amountIn,
    privateKey,
    count,
  }: {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    privateKey: string;
    count: number;
  }) => {
    const wallet = new ethers.Wallet(privateKey, provider);

    const swapRouterContract = new ethers.Contract(
      SWAP_ROUTER_ADDRESS,
      SWAP_ROUTER_ABI,
      wallet
    );

    try {
      const params = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: 3000,
        recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };

      const gasLimit = await swapRouterContract.exactInputSingle.estimateGas(
        params
      );

      const tx = await swapRouterContract.exactInputSingle(params, {
        gasLimit: gasLimit,
        value: 0,
      });

      addLog(`Transaction ${count + 1} hash: ${tx.hash}`);
      addLog("⏳ Waiting for block confirmation...");

      const receipt = await tx.wait();
      addLog(
        `✅ Swap ${count + 1} success ! Block number: ${receipt.blockNumber}`
      );
    } catch (error) {
      addLog(`❌ Swap error ${count + 1}: ${error}`);
    }
  };

  const onSubmit = async (data: FormValues) => {
    addLog(`🚀 Starting ${data.repeat} transactions...`);

    let count = 0;
    const runSwap = async () => {
      if (count >= data.repeat) {
        addLog("✅ All swap completed!");
        return;
      }

      for (const acc of accounts) {
        await swapTokens({
          tokenIn: data.tokenIn,
          tokenOut: data.tokenOut,
          amountIn: ethers.parseEther(data.amount),
          privateKey: acc.privateKey,
          count,
        });
      }

      count++;
      runSwap();
    };

    runSwap();
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 4,
        maxWidth: 1200,
        margin: "0 auto",
        padding: 4,
      }}
    >
      <div>
        <Box
          sx={{
            flex: 1,
            padding: 4,
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            borderRadius: 2,
            backgroundColor: "#fff",
            width: 400,
          }}
        >
          <Typography variant="h5" textAlign="center" mb={3}>
            Auto Swap
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="token-in-label">Token In</InputLabel>
              <Controller
                name="tokenIn"
                control={control}
                render={({ field }) => (
                  <Select
                    labelId="token-in-label"
                    label="Token In"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    value={field.value}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {tokenOptions.map((option) => (
                      <MenuItem key={option.name} value={option.value}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="token-out-label">Token Out</InputLabel>
              <Controller
                name="tokenOut"
                control={control}
                render={({ field }) => (
                  <Select
                    labelId="token-out-label"
                    label="Token Out"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    value={field.value}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {tokenOptions.map((option) => (
                      <MenuItem key={option.name} value={option.value}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>

            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Amount"
                  type="text"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                />
              )}
            />

            <Controller
              name="repeat"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Repeat"
                  type="number"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                />
              )}
            />

            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ marginTop: 2 }}
              >
                Start
              </Button>
            </Box>
          </form>
        </Box>
      </div>

      {/* Logs */}
      <Paper
        sx={{
          flex: 1,
          padding: 4,
          height: "700px",
          overflowY: "auto",
          width: "400px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          borderRadius: 2,
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="h5" textAlign="center" mb={2}>
          Logs
        </Typography>
        {logs.length === 0 ? (
          <Typography textAlign="center">No logs yet</Typography>
        ) : (
          logs.map((log, index) => (
            <Typography
              key={index}
              sx={{
                fontSize: "14px",
                marginBottom: "4px",
                wordBreak: "break-all",
              }}
            >
              {log}
            </Typography>
          ))
        )}
        <div ref={logEndRef} />
      </Paper>
    </Box>
  );
};

export default OGLabs;
