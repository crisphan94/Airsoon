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
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

const LENS_RPC_URL = "https://rpc.lens.xyz";
const INK_RPC_URL = "https://rpc-gel.inkonchain.com";

const routerAddress = {
  lens: "0xe7cb3e167e7475dE1331Cf6E0CEb187654619E12",
  ink: "0xB4A8d45647445EA9FC3E1058096142390683dBC2",
};

const erc20Abi = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const lensBridgeABI = [
  "function depositV3(address depositor, address recipient, address inputToken, address outputToken, uint256 inputAmount, uint256 outputAmount, uint256 destinationChainId, address exclusiveRelayer, uint32 quoteTimestamp, uint32 fillDeadline, uint32 exclusivityParameter, bytes message)",
];

const inkBridgeABI = [
  "function deposit(address spokePool, address recipient, address originToken, uint256 amount, uint256 destinationChainId, int64 relayerFeePct, uint32 quoteTimestamp, bytes message, uint256 maxCount)",
];

const tokenOptions = [
  {
    name: "WETH-LENS",
    inputToken: "0xE5ecd226b3032910CEaa43ba92EE8232f8237553",
    outputToken: "0x4200000000000000000000000000000000000006",
  },
  {
    name: "ETH-INK",
    inputToken: "0x4200000000000000000000000000000000000006",
    outputToken: "",
  },
];

type FormValues = {
  amount: string;
  repeat: number;
  inputToken: string;
  outputToken: string;
};

const LensProtocol: React.FC = () => {
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      amount: "0.0003",
      repeat: 10,
      inputToken: "0xE5ecd226b3032910CEaa43ba92EE8232f8237553",
      outputToken: "0x4200000000000000000000000000000000000006",
    },
  });

  const accounts = useFilteredAccounts();

  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const providerLens = new ethers.JsonRpcProvider(LENS_RPC_URL);
  const providerInk = new ethers.JsonRpcProvider(INK_RPC_URL);

  //balance
  const [inputBalance, setInputBalance] = useState("");
  const [outputBalance, setOutputBalance] = useState("");

  const [value, setValue] = React.useState("1");
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const isLensNetwork = (token: string) =>
    token === "0xE5ecd226b3032910CEaa43ba92EE8232f8237553";

  const setBalance = async (token: string, type: string) => {
    // LENS
    if (isLensNetwork(token)) {
      const wallet = new ethers.Wallet(accounts[0].privateKey, providerLens);
      const tokenContract = new ethers.Contract(token, erc20Abi, providerLens);

      const balance = await tokenContract.balanceOf(wallet.address);
      const decimals = await tokenContract.decimals();

      const formattedBalance = ethers.formatUnits(balance, decimals);
      type === "input"
        ? setInputBalance(formattedBalance)
        : setOutputBalance(formattedBalance);

      return;
    }

    const wallet = new ethers.Wallet(accounts[0].privateKey, providerInk);
    const balance = await providerInk.getBalance(wallet.address);

    const formattedBalance = ethers.formatEther(balance);
    type === "input"
      ? setInputBalance(formattedBalance)
      : setOutputBalance(formattedBalance);
  };

  const inputValue = watch("inputToken");
  const outputValue = watch("outputToken");

  useEffect(() => {
    if (accounts.length > 0) setBalance(inputValue, "input");
  }, [inputValue, accounts.length]);

  useEffect(() => {
    if (accounts.length > 0) setBalance(outputValue, "output");
  }, [outputValue, accounts.length]);

  if (accounts.length === 0) {
    return <>No wallets</>;
  }

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const encodeAmount = (decimalValue: string, decimals: number) => {
    return ethers.parseUnits(decimalValue, decimals);
  };

  const calculateOutputAmount = async (
    tokenIn: string,
    tokenOut: string,
    inputAmount: string,
    decimals: number
  ) => {
    const provider = new ethers.JsonRpcProvider(LENS_RPC_URL);
    const amountAbi = [
      "function getOutputAmount(address inputToken, address outputToken, uint256 inputAmount) view returns (uint256)",
    ];

    const bridgeContract = new ethers.Contract(
      routerAddress.lens,
      amountAbi,
      provider
    );
    const amount = ethers.parseUnits(inputAmount, decimals);

    const outputAmount = await bridgeContract.getOutputAmount(
      tokenIn,
      tokenOut,
      amount
    );

    return outputAmount.toString();
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
        const provider = isLensNetwork(data.inputToken)
          ? providerLens
          : providerInk;

        const bridgeABI = isLensNetwork(data.inputToken)
          ? lensBridgeABI
          : inkBridgeABI;
        const bridgeAddress = isLensNetwork(data.inputToken)
          ? routerAddress.lens
          : routerAddress.ink;

        const wallet = new ethers.Wallet(acc.privateKey, provider);

        const bridgeContract = new ethers.Contract(
          bridgeAddress,
          bridgeABI,
          wallet
        );

        const nonce = await wallet.getNonce("pending");

        const inputAmount = encodeAmount(data.amount, 14);

        const params = isLensNetwork(data.inputToken)
          ? {
              depositor: wallet.address,
              recipient: wallet.address,
              inputToken: data.inputToken,
              outputToken: data.outputToken,
              inputAmount,
              outputAmount: inputAmount - inputAmount * BigInt(0.000187),
            }
          : "";

        try {
          const est = isLensNetwork(data.inputToken)
            ? bridgeContract.depositV3.estimateGas()
            : bridgeContract.deposit.estimateGas();

          addLog(`Est: ${est}`);
        } catch (error) {
          addLog(`❌ Error in Transaction ${count + 1}: ${error}`);
        }
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
              <Tab label="Bridge" value="1" />
              <Tab label="Mint" value="2" />
              <Tab label="Tranfer" value="3" />
            </TabList>
          </Box>
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
                Auto Bridge
              </Typography>

              <form onSubmit={handleSubmit(onSubmit)}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="token-in-label">Token In</InputLabel>
                  <Controller
                    name="inputToken"
                    control={control}
                    render={({ field }) => (
                      <Select
                        labelId="token-in-label"
                        label="Input Token"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      >
                        <MenuItem value="">
                          <em>Select</em>
                        </MenuItem>
                        {tokenOptions.map((option) => (
                          <MenuItem key={option.name} value={option.inputToken}>
                            {option.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Typography sx={{ fontWeight: "bold" }}>
                    {inputBalance}
                  </Typography>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="token-out-label">Token In</InputLabel>
                  <Controller
                    name="outputToken"
                    control={control}
                    render={({ field }) => (
                      <Select
                        labelId="token-in-label"
                        label="Output Token"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      >
                        <MenuItem value="">
                          <em>Select</em>
                        </MenuItem>
                        {tokenOptions.map((option) => (
                          <MenuItem key={option.name} value={option.inputToken}>
                            {option.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Typography sx={{ fontWeight: "bold" }}>
                    {outputBalance}
                  </Typography>
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
        </TabContext>
      </Box>

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

export default LensProtocol;
