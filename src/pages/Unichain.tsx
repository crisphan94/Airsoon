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

const RPC_MAINET = "https://mainnet.unichain.org";
const RPC_TESTNET = "https://sepolia.unichain.org";

const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

const tokenOptions = [
  { name: "ETH", value: "ETH_ADDRESS" },
  { name: "WETH", value: WETH_ADDRESS },
];

const DEPOSIT_ABI = ["function deposit()"];
const WITHDRAW_ABI = ["function withdraw(uint256 wad)"];

const BALANCE_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

type FormValues = {
  amount: string;
  repeat: number;
  tokenIn: string;
  tokenOut: string;
};

const Unichain: React.FC = () => {
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      amount: "0.0001",
      repeat: 20,
      tokenIn: WETH_ADDRESS,
      tokenOut: "ETH_ADDRESS",
    },
  });

  const accounts = useFilteredAccounts();

  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const providerMainet = new ethers.JsonRpcProvider(RPC_MAINET);
  const providerTestnet = new ethers.JsonRpcProvider(RPC_TESTNET);

  //balance
  const [inputBalances, setInputBalances] = useState<
    { name: string; balance: string }[]
  >([]);
  const [outputBalances, setOutputBalances] = useState<
    { name: string; balance: string }[]
  >([]);

  const inputValue = watch("tokenIn");
  const outputValue = watch("tokenOut");

  const [value, setValue] = React.useState("1");
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const isNativeToken = (token: string) => token === "ETH_ADDRESS";

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const updateBalance = async (
    token: string,
    acc: { name: string; privateKey: string },
    type = "input"
  ) => {
    const balance = await getTokenBalance(token, acc.privateKey);
    const acccount = { name: acc.name, balance };
    type === "input"
      ? setInputBalances((state) => [...state, acccount])
      : setOutputBalances((state) => [...state, acccount]);
  };

  useEffect(() => {
    if (accounts.length > 0) {
      for (const acc of accounts) {
        updateBalance(inputValue, acc);
      }
    }
  }, [inputValue, accounts.length]);

  useEffect(() => {
    if (accounts.length > 0) {
      for (const acc of accounts) {
        updateBalance(outputValue, acc, "output");
      }
    }
  }, [outputValue, accounts.length]);

  if (accounts.length === 0) {
    return <>No wallets</>;
  }

  const getTokenBalance = async (token: string, privateKey: string) => {
    const wallet = new ethers.Wallet(privateKey, providerMainet);

    if (isNativeToken(token)) {
      const balance = await providerMainet.getBalance(wallet.address);

      return ethers.formatEther(balance);
    }

    const contract = new ethers.Contract(token, BALANCE_ABI, providerMainet);
    const balanceWei = await contract.balanceOf(wallet.address);
    const decimals = await contract.decimals();

    return ethers.formatUnits(balanceWei, decimals);
  };

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const swapTokens = async ({
    tokenIn,
    amountIn,
    privateKey,
    count,
  }: {
    tokenIn: string;
    amountIn: bigint;
    privateKey: string;
    count: number;
  }) => {
    const wallet = new ethers.Wallet(privateKey, providerMainet);

    const abi = isNativeToken(tokenIn) ? DEPOSIT_ABI : WITHDRAW_ABI;

    const swapContract = new ethers.Contract(WETH_ADDRESS, abi, wallet);

    const gasLimit = isNativeToken(tokenIn)
      ? await swapContract.deposit.estimateGas({
          value: amountIn,
        })
      : await swapContract.withdraw.estimateGas(amountIn);

    try {
      const tx = isNativeToken(tokenIn)
        ? await swapContract.deposit({
            value: amountIn,
            gasLimit,
          })
        : await swapContract.withdraw(amountIn, {
            value: 0n,
            gasLimit,
          });
      addLog(`⏳ Waiting ${count + 1} pendding confirmating..: ${tx.hash}`);

      const res = await tx.wait();
      addLog(`✅ Approve ${count + 1} confirmed in block: ${res.blockNumber}`);
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
      <Box sx={{ width: "400px", typography: "body1" }}>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Swap" value="1" />
              {/* <Tab label="Mint token" value="2" /> */}
              {/* <Tab label="Add liquidity" value="3" /> */}
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
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setInputBalances([]);
                          }}
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
                  {inputBalances.map((item, index) => (
                    <div key={index} style={{ marginBottom: "20px" }}>
                      <Typography sx={{ fontWeight: "bold" }}>
                        {item.name}: {item.balance}
                      </Typography>
                    </div>
                  ))}

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
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setOutputBalances([]);
                          }}
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
                    {outputBalances.map((item, index) => (
                      <div key={index} style={{ marginTop: "20px" }}>
                        <Typography sx={{ fontWeight: "bold" }}>
                          {item.name}: {item.balance}
                        </Typography>
                      </div>
                    ))}
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

export default Unichain;
