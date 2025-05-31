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
  Input,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { ethers, Wallet } from "ethers";
import useFilteredAccounts from "../hooks/useFilteredAccounts";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

const RPC_MAINET = "https://testnet.dplabs-internal.com";

const WGHO_ADDRESS = "0x76aaada469d23216be5f7c596fa25f282ff9b364";

const tokenOptions = [
  { name: "PHRS", value: "GHO_ADDRESS" },
  { name: "WPHRS", value: WGHO_ADDRESS },
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

const Pharos: React.FC = () => {
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      amount: "0.001",
      repeat: 20,
      tokenIn: WGHO_ADDRESS,
      tokenOut: "GHO_ADDRESS",
    },
  });

  const accounts = useFilteredAccounts();

  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const providerMainet = new ethers.JsonRpcProvider(RPC_MAINET);

  const [inputBalances, setInputBalances] = useState<
    { name: string; balance: string }[]
  >([]);
  const [outputBalances, setOutputBalances] = useState<
    { name: string; balance: string }[]
  >([]);
  const [sendAmouunt, setSendAmount] = useState(100);

  const inputValue = watch("tokenIn");
  const outputValue = watch("tokenOut");

  const [value, setValue] = React.useState("1");
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const isNativeToken = (token: string) => token === "GHO_ADDRESS";

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
    const fetchSequentially = async () => {
      if (accounts.length === 0) return;

      for (const acc of accounts) {
        await updateBalance(inputValue, acc);
      }
    };

    fetchSequentially();
  }, [inputValue, accounts.length]);

  useEffect(() => {
    const fetchSequentially = async () => {
      if (accounts.length === 0) return;

      for (const acc of accounts) {
        await updateBalance(outputValue, acc, "output");
      }
    };

    fetchSequentially();
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
    name,
    tokenIn,
    amountIn,
    privateKey,
    count,
  }: {
    name: string;
    tokenIn: string;
    amountIn: bigint;
    privateKey: string;
    count: number;
  }) => {
    const wallet = new ethers.Wallet(privateKey, providerMainet);

    const abi = isNativeToken(tokenIn) ? DEPOSIT_ABI : WITHDRAW_ABI;

    const swapContract = new ethers.Contract(WGHO_ADDRESS, abi, wallet);

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

      addLog(`✅ Swap completed ${name} - ${count + 1}: ${tx.hash}!`);
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
          name: acc.name,
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

  const send = async () => {
    addLog(`🚀 Starting send `);

    let count = 0;
    const runSend = async () => {
      if (count >= sendAmouunt) {
        addLog("✅ Sent completed!");
        return;
      }

      for (const acc of accounts) {
        const wallet = new ethers.Wallet(acc.privateKey, providerMainet);

        try {
          const tx = await wallet.sendTransaction({
            to: Wallet.createRandom(),
            value: ethers.parseEther("0.00001"),
          });
          addLog(`✅ Send with ${acc.name} completed hash: ${tx.hash}`);
        } catch (error) {
          addLog(`❌ Error  ${error}`);
        }
      }

      count++;
      runSend();
    };

    runSend();
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
              <Tab label="Send" value="2" />
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
                    <Typography key={index} sx={{ fontWeight: "bold" }}>
                      {item.name}: {item.balance}
                    </Typography>
                  ))}

                  <FormControl fullWidth sx={{ my: 2 }}>
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
                      <Typography key={index} sx={{ fontWeight: "bold" }}>
                        {item.name}: {item.balance}
                      </Typography>
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
            <TabPanel value="2">
              <TextField
                onChange={(e) => setSendAmount(Number(e.target.value))}
                label="Amount"
                type="text"
                variant="outlined"
                fullWidth
                margin="normal"
              />
              <Button variant="contained" color="primary" onClick={send}>
                Send
              </Button>
            </TabPanel>
          </Box>
        </TabContext>
      </Box>

      {/* Logs */}
      <Paper
        sx={{
          flex: 1,
          padding: 4,
          height: "600px",
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

export default Pharos;
