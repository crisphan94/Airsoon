import React, { useState, useRef, useEffect } from "react";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { ethers } from "ethers";

const HUMANITY_RPC_URL = "https://rpc.testnet.humanity.org/";
const CLAIM_CONTRACT = "0xa18f6FCB2Fd4884436d10610E69DB7BFa1bFe8C7";

type FormValues = {
  amount: string;
  repeat: number;
};

const HumanityProtocol: React.FC = () => {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      amount: "0.001",
      repeat: 50,
    },
  });

  const [logs, setLogs] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const provider = new ethers.JsonRpcProvider(HUMANITY_RPC_URL);
  const privateKey = import.meta.env.VITE_PRIVATE_KEY_PTANQN;
  const wallet = new ethers.Wallet(privateKey, provider);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const generateData = () => {
    const addressHex = wallet.address
      .toLowerCase()
      .replace("0x", "")
      .padStart(64, "0");
    return `0x51cff8d9000000000000000000000000${addressHex}`;
  };

  const onSubmit = async (data: FormValues) => {
    addLog(`🚀 Starting ${data.repeat} transactions...`);

    const inputData = generateData();
    addLog(`✅ Data generated for ${wallet.address}: ${inputData}`);

    let count = 0;
    intervalRef.current = setInterval(async () => {
      if (count >= data.repeat) {
        clearInterval(intervalRef.current!);
        addLog("✅ All transactions completed!");
        return;
      }

      try {
        const tx = await wallet.sendTransaction({
          to: CLAIM_CONTRACT,
          data: generateData(),
          value: ethers.parseEther(data.amount),
        });

        addLog(
          `⏳ Transaction ${count + 1}/${data.repeat} pending confirmation...`
        );
        await tx.wait();
        addLog(`✅ Transaction ${count + 1} confirmed: ${tx.hash}`);
      } catch (error) {
        addLog(`❌ Error in Transaction ${count + 1}: ${error}`);
      }

      count++;
    }, 8000);
  };

  const stopTransactions = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      addLog("🛑 Stopped!");
    }
  };

  const claimReward = async () => {
    addLog(`🚀 Starting claim reward...`);
    try {
      const tx = await wallet.sendTransaction({
        to: CLAIM_CONTRACT,
        data: "0xb88a802f",
        value: 0n,
      });

      addLog(`⏳ Transaction pending confirmation...`);

      await tx.wait();
      addLog(`✅ Transaction confirmed: ${tx.hash}`);
    } catch (error) {
      addLog(`❌ Error  ${error}`);
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
            Auto Bridge tHP
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
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 2 }}
              onClick={claimReward}
            >
              Claim Genesis Reward
            </Button>
          </Box>
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

export default HumanityProtocol;
