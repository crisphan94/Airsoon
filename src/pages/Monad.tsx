import React, { useState, useRef, useEffect } from "react";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { ethers } from "ethers";
import useFilteredAccounts from "../hooks/useFilteredAccounts";

const RPC_URL = "https://testnet-rpc.monad.xyz";

const Monad: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [mintCount, setMintCount] = useState(10);
  const mintInterval = useRef<NodeJS.Timeout | null>(null);
  const accounts = useFilteredAccounts();

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

  const startDeploy = () => {
    addLog(`🚀 Starting ${mintCount} deploy...`);

    let count = 0;
    mintInterval.current = setInterval(async () => {
      if (count >= mintCount) {
        clearInterval(mintInterval.current!);
        addLog("✅ All transactions completed!");
        return;
      }

      for (const acc of accounts) {
        const wallet = new ethers.Wallet(acc.privateKey, provider);
        try {
          const tx = await wallet.sendTransaction({
            data: "0x60806040527389a512a24e9d63e98e41f681bf77f27a7ef89eb76000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163460405161009f90610185565b60006040518083038185875af1925050503d80600081146100dc576040519150601f19603f3d011682016040523d82523d6000602084013e6100e1565b606091505b5050905080610125576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161011c9061019a565b60405180910390fd5b506101d6565b60006101386007836101c5565b91507f4661696c757265000000000000000000000000000000000000000000000000006000830152602082019050919050565b60006101786000836101ba565b9150600082019050919050565b60006101908261016b565b9150819050919050565b600060208201905081810360008301526101b38161012b565b9050919050565b600081905092915050565b600082825260208201905092915050565b603f806101e46000396000f3fe6080604052600080fdfea264697066735822122095fed2c557b62b9f55f8b3822b0bdc6d15fd93abb95f37503d3f788da6cbb30064736f6c63430008000033",
            value: 0n,
          });

          addLog(`⏳ Deploy ${count + 1}/${mintCount} pending confirmation...`);
          await tx.wait();
          addLog(`✅ Deploy ${count + 1} confirmed: ${tx.hash}`);
        } catch (error) {
          addLog(`❌ Error in Deploy ${count + 1}: ${error}`);
        }
      }

      count++;
    }, 5000);
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
            maxWidth: 600,
            margin: "50px auto",
            padding: 8,
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            borderRadius: 2,
            backgroundColor: "#fff",
          }}
        >
          <Typography variant="h5" textAlign="center" mb={3}>
            Auto Deploy Contract
          </Typography>
          <TextField
            label="Total"
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
              onClick={startDeploy}
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

export default Monad;
