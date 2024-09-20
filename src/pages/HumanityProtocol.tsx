import React, { useState, useRef, useEffect } from "react";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { ethers } from "ethers";
import useFilteredAccounts from "../hooks/useFilteredAccounts";

const HUMANITY_RPC_URL = "http://localhost:3000/humanity";
const CLAIM_CONTRACT = "0xa18f6FCB2Fd4884436d10610E69DB7BFa1bFe8C7";
const BRIDGE_CONTRACT = "0x5F7CaE7D1eFC8cC05da97D988cFFC253ce3273eF";

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
  const logEndRef = useRef<HTMLDivElement>(null);
  const accounts = useFilteredAccounts();

  const provider = new ethers.JsonRpcProvider(HUMANITY_RPC_URL);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (accounts.length === 0) {
    return <>No wallets</>;
  }

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const generateData = (
    destinationNetwork: number,
    destinationAddress: string,
    amount: bigint,
    token: string,
    forceUpdateGlobalExitRoot: boolean,
    permitData: string
  ) => {
    const iface = new ethers.Interface([
      "function bridgeAsset(uint32 destinationNetwork, address destinationAddress, uint256 amount, address token, bool forceUpdateGlobalExitRoot, bytes permitData)",
    ]);

    return iface.encodeFunctionData("bridgeAsset", [
      destinationNetwork,
      destinationAddress,
      amount,
      token,
      forceUpdateGlobalExitRoot,
      permitData,
    ]);
  };

  const onSubmit = async (data: FormValues) => {
    addLog(`🚀 Starting ${data.repeat} transactions...`);

    let count = 0;
    const runSwap = async () => {
      if (count >= data.repeat) {
        addLog("✅ All transactions completed!");
        return;
      }

      for (const acc of accounts) {
        const wallet = new ethers.Wallet(acc.privateKey, provider);
        const nonce = await wallet.getNonce("pending");

        try {
          const tx = await wallet.sendTransaction({
            to: BRIDGE_CONTRACT,
            data: generateData(
              0,
              wallet.address,
              ethers.parseEther(data.amount),
              ethers.ZeroAddress,
              true,
              "0x"
            ),
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
      runSwap();
    };

    runSwap();
  };

  const claimReward = async () => {
    addLog(`🚀 Starting claim reward...`);

    for (const acc of accounts) {
      const wallet = new ethers.Wallet(acc.privateKey, provider);
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
