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
import { ethers } from "ethers";
import useFilteredAccounts from "../hooks/useFilteredAccounts";

const MONNAD_RPC = "https://testnet-rpc.monad.xyz";
const OG_RPC = "https://evmrpc-testnet.0g.ai";
const HUMANITY_RPC = "http://localhost:3000/humanity";
const MEGAETH_RPC = "https://carrot.megaeth.com/rpc";
const SEISMIC_RPC = "https://node-2.seismicdev.net/rpc";
const BASE_RPC = "https://sepolia.base.org";

const BYTE_CODE =
  "0x6080604052348015600f57600080fd5b5061018d8061001f6000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063557ed1ba1461003b578063d09de08a14610059575b600080fd5b610043610063565b60405161005091906100d9565b60405180910390f35b61006161006c565b005b60008054905090565b600160008082825461007e9190610123565b925050819055507f3912982a97a34e42bab8ea0e99df061a563ce1fe3333c5e14386fd4c940ef6bc6000546040516100b691906100d9565b60405180910390a1565b6000819050919050565b6100d3816100c0565b82525050565b60006020820190506100ee60008301846100ca565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061012e826100c0565b9150610139836100c0565b9250828201905080821115610151576101506100f4565b5b9291505056fea2646970667358221220801aef4e99d827a7630c9f3ce9c8c00d708b58053b756fed98cd9f2f5928d10f64736f6c634300081c0033";

const DEPLOY_ABI = [
  {
    inputs: [],
    name: "getCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "increment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newCount",
        type: "uint256",
      },
    ],
    name: "CountUpdated",
    type: "event",
  },
];

const AutoDeploy = ({
  setLog,
  accounts,
  provider,
}: {
  setLog: (msg: string) => void;
  accounts: {
    name: string;
    privateKey: string;
    projects: string[];
    projectWithChild?: {
      deploy: string[];
    };
  }[];
  provider: ethers.JsonRpcProvider;
}) => {
  const [mintCount, setMintCount] = useState(10);
  const [balances, setBalances] = useState<{ name: string; balance: string }[]>(
    []
  );

  const updateBalance = async (name: string, privateKey: string) => {
    const balance = await getTokenBalance(privateKey);
    const acccount = { name: name, balance: Number(balance).toFixed(4) };
    setBalances((state) => [...state, acccount]);
  };

  const getTokenBalance = async (privateKey: string) => {
    const wallet = new ethers.Wallet(privateKey, provider);

    const balance = await provider.getBalance(wallet.address);

    return ethers.formatEther(balance);
  };

  useEffect(() => {
    setBalances([]);

    const fetchSequentially = async () => {
      if (accounts.length === 0) return;

      for (const acc of accounts) {
        await updateBalance(acc.name, acc.privateKey);
      }
    };

    fetchSequentially();
  }, [accounts]);

  const startDeploy = () => {
    setLog(`🚀 Starting ${mintCount} deploy...`);

    let count = 0;
    const deploy = async () => {
      if (count >= mintCount) {
        setLog("✅ All transactions completed!");
        return;
      }

      for (const acc of accounts) {
        const wallet = new ethers.Wallet(acc.privateKey, provider);

        try {
          const factory = new ethers.ContractFactory(
            DEPLOY_ABI,
            BYTE_CODE,
            wallet
          );

          const deployedContract = await factory.deploy();
          setLog("⏳ Waiting for deploying...");
          await deployedContract.waitForDeployment();
          setLog(`✅ Deploy success ${acc.name} - ${count + 1}`);
        } catch (error) {
          setLog(`❌ Error in Deploy ${count + 1}: ${error}`);
        }
      }

      count++;
      deploy();
    };

    deploy();
  };

  return (
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
      {balances.map((item, index) => (
        <Typography key={index} sx={{ fontWeight: "bold" }}>
          {item.name}: {item.balance}
        </Typography>
      ))}
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
      </Box>
    </Box>
  );
};

const DeployContract: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const accounts = useFilteredAccounts();

  const [selectedChain, setSelectedChain] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<
    {
      name: string;
      privateKey: string;
      projects: string[];
      projectWithChild?: {
        deploy: string[];
      };
    }[]
  >();

  useEffect(() => {
    const key =
      chains.find((chain) => chain.value === selectedChain)?.key ?? "";
    const accs = accounts.filter((acc) =>
      acc.projectWithChild?.deploy.includes(key)
    );

    setSelectedAccounts(accs);
  }, [selectedChain]);

  const chains = [
    {
      key: "og",
      name: "OG Galileo Testnet (V3)",
      value: OG_RPC,
      icon: "https://img.cryptorank.io/coins/0_g_labs1711467106027.png",
    },
    {
      key: "monad",
      name: "Monad Testnet",
      value: MONNAD_RPC,
      icon: "https://img.cryptorank.io/coins/monad1710498467135.png",
    },
    {
      key: "humanity",
      name: "Humanity Protocol Testnet",
      value: HUMANITY_RPC,
      icon: "https://img.cryptorank.io/coins/humanity_protocol1709113797405.png",
    },
    {
      key: "megaeth",
      name: "MEGAETH Testnet",
      value: MEGAETH_RPC,
      icon: "https://img.cryptorank.io/coins/mega_eth1736756550892.png",
    },
    {
      key: "seismic",
      name: "Seismic Devnet",
      value: SEISMIC_RPC,
      icon: "https://img.cryptorank.io/coins/seismic1741270608798.png",
    },
    {
      key: "inco",
      name: "Inco Base Sepolia",
      value: BASE_RPC,
      icon: "https://img.cryptorank.io/coins/inco_network1708524859049.png",
    },
  ];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (accounts.length === 0) {
    return <>No wallets</>;
  }

  const provider = new ethers.JsonRpcProvider(selectedChain);

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
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
      <div style={{ width: 400 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="chain-in-label">Chain</InputLabel>
          <Select
            labelId="chain-in-label"
            label="Chain"
            onChange={(e) => {
              setSelectedChain(e.target.value);
              setSelectedAccounts([]);
            }}
            value={selectedChain}
          >
            <MenuItem value="">
              <em>Select chain</em>
            </MenuItem>
            {chains.map((option) => (
              <MenuItem key={option.name} value={option.value}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={option.icon}
                    style={{ width: 30, height: 30, marginRight: 12 }}
                  />
                  {option.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedChain && (
          <AutoDeploy
            key={selectedChain}
            setLog={addLog}
            accounts={selectedAccounts!}
            provider={provider}
          />
        )}
      </div>

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

export default DeployContract;
