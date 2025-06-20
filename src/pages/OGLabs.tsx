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
  Tab,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { ethers } from "ethers";
import useFilteredAccounts from "../hooks/useFilteredAccounts";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

const RPC_URL = "https://evmrpc-testnet.0g.ai";
const SWAP_ROUTER_ADDRESS = "0xb95B5953FF8ee5D5d9818CdbEfE363ff2191318c";

const tokenOptions = [
  { name: "USDT", value: "0x3eC8A8705bE1D5ca90066b37ba62c4183B024ebf" },
  { name: "ETH", value: "0x0fE9B43625fA7EdD663aDcEC0728DD635e4AbF7c" },
  { name: "BTC", value: "0x36f6414FF1df609214dDAbA71c84f18bcf00F67d" },
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

const POOL_ABI = [
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
      { internalType: "int24", name: "tick", type: "int24" },
      { internalType: "uint16", name: "observationIndex", type: "uint16" },
      {
        internalType: "uint16",
        name: "observationCardinality",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "observationCardinalityNext",
        type: "uint16",
      },
      { internalType: "uint8", name: "feeProtocol", type: "uint8" },
      { internalType: "bool", name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
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
      amount: "20",
      repeat: 10,
      tokenIn: "0x3eC8A8705bE1D5ca90066b37ba62c4183B024ebf",
      tokenOut: "0x0fE9B43625fA7EdD663aDcEC0728DD635e4AbF7c",
    },
  });

  const accounts = useFilteredAccounts();

  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const [value, setValue] = React.useState("1");
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const [selectedMintToken, setSelectedMintToken] = useState(
    "0x3eC8A8705bE1D5ca90066b37ba62c4183B024ebf"
  );

  const [balances, setBalances] = useState<{ name: string; balance: string }[]>(
    []
  );

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const updateBalance = async (name: string, privateKey: string) => {
    const balance = await getTokenBalance(privateKey);
    const acccount = { name: name, balance };
    setBalances((state) => [...state, acccount]);
  };

  const getTokenBalance = async (privateKey: string) => {
    const wallet = new ethers.Wallet(privateKey, provider);

    const balance = await provider.getBalance(wallet.address);

    return ethers.formatEther(balance);
  };

  useEffect(() => {
    const fetchSequentially = async () => {
      if (accounts.length === 0) return;

      for (const acc of accounts) {
        await updateBalance(acc.name, acc.privateKey);
      }
    };

    fetchSequentially();
  }, [accounts.length]);

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
    name,
    repeat,
  }: {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    privateKey: string;
    count: number;
    name: string;
    repeat: number;
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
      addLog(
        `⏳ Transaction ${name} - ${count + 1}/${repeat} hash: ${
          tx.hash
        } pending confirmation...`
      );
      await tx.wait();
      addLog(`✅ Transaction ${name} - ${count + 1}/${repeat} confirmed`);
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
          name: acc.name,
          repeat: data.repeat,
        });
      }

      count++;
      runSwap();
    };

    runSwap();
  };

  const MINT_ABI = ["function mint() public"];

  const mintToken = async () => {
    const tokenName = tokenOptions.find(
      (item) => item.value === selectedMintToken
    )?.name;

    addLog(`🚀 Starting mint ${tokenName}`);

    let count = 0;
    const runMint = async () => {
      if (count >= accounts.length) {
        addLog(`✅ All mint ${tokenName} completed!`);
        return;
      }

      for (const acc of accounts) {
        const wallet = new ethers.Wallet(acc.privateKey, provider);

        const mintContract = new ethers.Contract(
          selectedMintToken,
          MINT_ABI,
          wallet
        );

        const tx = await mintContract.mint();
        addLog(
          `✅ Mint ${tokenName} with ${acc.name} completed hash: ${tx.hash}`
        );
        count++;
      }

      count++;
      runMint();
    };

    runMint();
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
      <Box sx={{ width: "400px", typography: "body1" }}>
        {balances.map((item, index) => (
          <Typography key={index} sx={{ fontWeight: "bold" }}>
            {item.name}: {item.balance}
          </Typography>
        ))}
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Swap" value="1" />
              <Tab label="Mint token" value="2" />
              <Tab label="Add liquidity" value="3" />
            </TabList>
            <TabPanel value="1">
              <Box
                sx={{
                  flex: 1,
                  padding: 4,
                  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                  borderRadius: 2,
                  backgroundColor: "#fff",
                  width: 350,
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
            </TabPanel>
            <TabPanel value="2">
              <InputLabel id="mint-token">Token Mint</InputLabel>
              <Select
                labelId="mint-token"
                label="Token"
                sx={{ width: "80%" }}
                onChange={(e) => setSelectedMintToken(e.target.value)}
                value={selectedMintToken}
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
              <Button onClick={mintToken}>Mint</Button>
            </TabPanel>
          </Box>
        </TabContext>
      </Box>
      <div></div>

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
