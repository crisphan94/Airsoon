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

const RPC_URL = "https://rpc-qnd.inkonchain.com";
const SWAP_ROUTER_ADDRESS = "0xaaaaaaae92Cc1cEeF79a038017889fDd26D23D4d";

const USDT_ADDRESS = "0x0200C29006150606B650577BBE7B6248F58470c1";
const USDC_ADDRESS = "0xF1815bd50389c46847f0Bda824eC8da914045D14";

const tokenOptions = [
  { name: "USDT", value: USDT_ADDRESS },
  { name: "USDC", value: USDC_ADDRESS },
];

const SWAP_ABI = [
  "transferAndMulticall(address[] tokens, uint256[] amounts, address[] targets, bytes[] datas, uint256[] values, address refundTo)",
];

const APPROVE_ABI = ["function approve(address spender, uint256 amount)"];

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

const SupperChain: React.FC = () => {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      amount: "0.2",
      repeat: 20,
      tokenIn: USDC_ADDRESS,
      tokenOut: USDT_ADDRESS,
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

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (accounts.length === 0) {
    return <>No wallets</>;
  }

  const updateTokenBalance = async (token: string) => {
    const contract = new ethers.Contract(token, BALANCE_ABI, provider);

    const balanceWei = await contract.balanceOf(
      "0x489522a4a8ecc94E3421A8605fBB57CfDED6A52f"
    );
    const decimals = await contract.decimals();
    return ethers.formatUnits(balanceWei, decimals);
  };

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  function encodeApprove(spender: string, amount: bigint) {
    const iface = new ethers.Interface([
      "function approve(address spender, uint256 amount)",
    ]);

    if (spender === USDT_ADDRESS) {
      return iface.encodeFunctionData("approve", [
        "0x177778F19E89dD1012BdBe603F144088A95C4B53",
        amount,
      ]);
    }
    //USDC
    return iface.encodeFunctionData("approve", [
      "0xba7bAC71a8Ee550d89B827FE6d67bc3dCA07b104",
      amount,
    ]);
  }

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

    const approveContract = new ethers.Contract(tokenIn, APPROVE_ABI, wallet);

    addLog(`${encodeApprove(tokenIn, amountIn)}`);
    return;

    try {
      const approve = await approveContract.approve(tokenIn, amountIn);
      addLog(`⏳ Waiting ${count} pendding confirmating..: ${approve.hash}`);

      const res = await approve.wait();
      addLog(`✅ Approve ${count} confirmed in block: ${res.blockNumber}`);

      const swapContract = new ethers.Contract(
        SWAP_ROUTER_ADDRESS,
        SWAP_ABI,
        wallet
      );

      const tx = await swapContract.transferAndMulticall(
        [tokenIn],
        [amountIn],
        [
          tokenIn,
          "0xf70da97812CB96acDF810712Aa562db8dfA3dbEF",
          "0xba7bAC71a8Ee550d89B827FE6d67bc3dCA07b104",
          "0xeeeeee9eC4769A09a76A83C7bC42b185872860eE",
        ],
        [
          "0x0200C29006150606B650577BBE7B6248F58470c1",
          "0xf70da97812CB96acDF810712Aa562db8dfA3dbEF",
          "0x177778F19E89dD1012BdBe603F144088A95C4B53",
          "0xeeeeee9eC4769A09a76A83C7bC42b185872860eE",
        ],
        [
          "0x095ea7b3000000000000000000000000ba7bac71a8ee550d89b827fe6d67bc3dca07b104000000000000000000000000000000000000000000000000000000000024ee9d",
          "0x",
          "0x73fc44570000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000026f021c00e0eeeeee9ec4769a09a76a83c7bc42b185872860eef1815bd50389c46847f0bda824ec8da914045d140200c29006150606b650577bbe7b6248f58470c1e000d4e800d9f800dde800dfa9c22a35955a2caf4b7a81f7f4b8d0f50567cc369e6ded2f3cb9d13a2a7b76b87da6fba68076c751808e3331cc38aee00fad8f4c32b1001fd8356b840c4d267e1b0000e067f635e2e8249478f800e824ee9d060300de128acb08000000000000000000000000fffd8963efd1fc6a506488495d951d5263988d2500000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000014f1815bd50389c46847f0bda824ec8da914045d140000000000000000000000000100e60603008a0300de0400ea0080317728bcce5d1c2895b71b01eebbb6989ae504ae00070a00000000000000000000000000000000000000000000000000000000000003018d050000020070000206070706000000000000000000000000000000000000000000000000000000e824f30f0301b70500600301d800020a0b00000000000000000000000000000000000000000000000000000000000301e50500800301d8eda49bce2f38d284f839be1f4f2e23e6c7cc7dbd02007002020f0500a000050607080700000000000000000000000000000000000000000000000000000003022c0500800301d80500600200700200480500c002000000e200e60000000040016a0179017907002001ae01b4000006002001b401b7000008002001dc01e500000700200206020f00000300000223022c0000080020024d025900000300000259026200000000000000000000000000000000000000",
          "0x3dad0c9c0000000000000000000000000200c29006150606b650577bbe7b6248f58470c1000000000000000000000000489522a4a8ecc94e3421a8605fbb57cfded6a52f",
        ],
        [
          "0x095ea7b3000000000000000000000000177778f19e89dd1012bdbe603f144088a95c4b53000000000000000000000000000000000000000000000000000000000024f4b4",
          "0x",
          "0x5ae401dc0000000000000000000000000000000000000000000000000000000067f6394400000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e404e45aaf0000000000000000000000000200c29006150606b650577bbe7b6248f58470c1000000000000000000000000f1815bd50389c46847f0bda824ec8da914045d140000000000000000000000000000000000000000000000000000000000000064000000000000000000000000eeeeee9ec4769a09a76a83c7bc42b185872860ee000000000000000000000000000000000000000000000000000000000024f4b40000000000000000000000000000000000000000000000000000000000249100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          "0x3dad0c9c000000000000000000000000f1815bd50389c46847f0bda824ec8da914045d14000000000000000000000000489522a4a8ecc94e3421a8605fbb57cfded6a52f",
        ],
        [("0", "0", "0", "0")],
        wallet.address,
        {
          gasLimit: "526029",
          gasPrice: ethers.parseUnits("0.00001053", "gwei"),
        }
      );

      // Chờ giao dịch được xác nhận
      const receipt = await tx.wait();
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
          amountIn: ethers.parseUnits(data.amount, 6),
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
              <Tab label="soneium" value="1" />
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
                  {/* <Typography>
                    {updateTokenBalance(
                      "0x489522a4a8ecc94E3421A8605fBB57CfDED6A52f"
                    )}
                  </Typography> */}

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

export default SupperChain;
