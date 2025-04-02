import React, { useState, useRef, useEffect } from "react";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { ethers } from "ethers";
import useFilteredAccounts from "../hooks/useFilteredAccounts";

const LENS_RPC_URL = "https://rpc.testnet.lens.dev";
const BRIDGE_CONTRACT = "0x000000000000000000000000000000000000800A";
const MINT_CONTRACT = "0x6ab1af878aeac419b98c0ab6bdcc05bd9d326c20";

type FormValues = {
  amount: string;
  repeat: number;
};

const LensProtocol: React.FC = () => {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      amount: "0.0001",
      repeat: 50,
    },
  });

  const accounts = useFilteredAccounts();

  const [logs, setLogs] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [mintCount, setMintCount] = useState(10);
  const mintInterval = useRef<NodeJS.Timeout | null>(null);
  const provider = new ethers.JsonRpcProvider(LENS_RPC_URL);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (accounts.length === 0) {
    return <>No wallets</>;
  }

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const onSubmit = async (data: FormValues) => {
    addLog(`🚀 Starting ${data.repeat} transactions...`);

    let count = 0;
    intervalRef.current = setInterval(async () => {
      if (count >= data.repeat) {
        clearInterval(intervalRef.current!);
        addLog("✅ All transactions completed!");
        return;
      }

      for (const acc of accounts) {
        const wallet = new ethers.Wallet(acc.privateKey, provider);

        const generateData = () => {
          const addressHex = wallet.address
            .toLowerCase()
            .replace("0x", "")
            .padStart(64, "0");
          return `0x51cff8d9000000000000000000000000${addressHex}`;
        };
        addLog(`✅ Data generated for ${wallet.address}: ${generateData()}`);

        const nonce = await wallet.getNonce("pending");

        try {
          const tx = await wallet.sendTransaction({
            to: BRIDGE_CONTRACT,
            data: generateData(),
            value: ethers.parseEther(data.amount),
            nonce,
          });

          addLog(
            `⏳ Transaction ${count + 1}/${data.repeat} pending confirmation...`
          );
          await tx.wait();
          addLog(`✅ Transaction ${count + 1} confirmed: ${tx.hash}`);
        } catch (error) {
          addLog(`❌ Error in Transaction ${count + 1}: ${error}`);
        }
      }

      count++;
    }, 10000);
  };

  const stopTransactions = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      addLog("🛑 Stopped!");
    }
  };

  const startMinting = () => {
    addLog(`🚀 Starting ${mintCount} transactions...`);

    let count = 0;
    mintInterval.current = setInterval(async () => {
      if (count >= mintCount) {
        clearInterval(mintInterval.current!);
        addLog("✅ All transactions completed!");
        return;
      }

      for (const acc of accounts) {
        const wallet = new ethers.Wallet(acc.privateKey, provider);

        const generateMintData = () => {
          const addressHex = wallet.address.toLowerCase().replace("0x", "");
          return `0x84bb1e42000000000000000000000000${addressHex}0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`;
        };
        addLog(
          `✅ Data generated for ${wallet.address}: ${generateMintData()}`
        );

        const nonce = await wallet.getNonce("pending");

        try {
          const tx = await wallet.sendTransaction({
            to: MINT_CONTRACT,
            data: generateMintData(),
            value: ethers.parseEther("0.0001"),
            nonce,
          });

          addLog(
            `⏳ Transaction ${count + 1}/${mintCount} pending confirmation...`
          );
          await tx.wait();
          addLog(`✅ Transaction ${count + 1} confirmed: ${tx.hash}`);
        } catch (error) {
          addLog(`❌ Error in Transaction ${count + 1}: ${error}`);
        }
      }

      count++;
    }, 8000);
  };

  const stopMinting = () => {
    if (mintInterval.current) {
      clearInterval(mintInterval.current);
      addLog("🛑 Stopped!");
    }
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
            Auto Bridge GRASS
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
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
              <Button
                variant="contained"
                color="error"
                fullWidth
                sx={{ marginTop: 2 }}
                onClick={stopTransactions}
              >
                Stop
              </Button>
            </Box>
          </form>
        </Box>

        <Box
          sx={{
            maxWidth: 600,
            margin: "50px auto",
            padding: 8,
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            borderRadius: 2,
            backgroundColor: "#fff",
          }}
        >
          <Typography variant="h5" textAlign="center" mb={3}>
            Auto Mint NFT
          </Typography>
          <TextField
            label="Mint Count"
            type="text"
            value={mintCount}
            onChange={(e) => setMintCount(Number(e.target.value))}
            fullWidth
            margin="normal"
          />
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 2 }}
              onClick={startMinting}
            >
              Start
            </Button>
            <Button
              variant="contained"
              color="error"
              fullWidth
              sx={{ marginTop: 2 }}
              onClick={stopMinting}
            >
              Stop
            </Button>
          </Box>
        </Box>

        {/* <Box
        sx={{
          maxWidth: 800,
          margin: "50px auto",
          padding: 8,
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          borderRadius: 2,
          backgroundColor: "#fff",
        }}
      >
      <Typography variant="h5" textAlign="center" mb={3}>
        Auto Claim GRASS
      </Typography>
      
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ marginTop: 2 }}
      >
          Check pending claim 
      </Button>
      </Box> */}
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
              sx={{ fontSize: "14px", marginBottom: "4px" }}
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

export default LensProtocol;
