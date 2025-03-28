import { ethers } from 'ethers';

// Standard ERC20 ABI for token interactions
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
];

// UniswapV2 Router ABI (minimal required functions)
const ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
];

// Token addresses for the testnet
const TOKEN_ADDRESSES = {
  WETH: "0xce830D0905e0f7A9b300401729761579c5FB6bd6", // Goerli WETH
  USDT: "0x9A87C2412d500343c073E5Ae5394E3bE3874F76b", // Example testnet USDT
  WBTC: "0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05", // Example testnet WBTC
};

// Router address for the testnet
const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private router: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
    this.router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, this.provider);
  }

  async executeSwap(privateKey: string, fromToken: string, toToken: string) {
    try {
      // Create wallet instance
      const wallet = new ethers.Wallet(privateKey, this.provider);
      console.log('Wallet address:', wallet.address);

      // Get token contracts
      const fromTokenContract = new ethers.Contract(
        TOKEN_ADDRESSES[fromToken],
        ERC20_ABI,
        wallet
      );

      // Check balance
      const balance = await fromTokenContract.balanceOf(wallet.address);
      console.log(`${fromToken} balance:`, balance.toString());

      if (balance.isZero()) {
        throw new Error(`No ${fromToken} balance available`);
      }

      // Calculate swap amount (using 50% of balance)
      const amountIn = balance.div(2);

      // Get path for swap
      const path = [TOKEN_ADDRESSES[fromToken], TOKEN_ADDRESSES[toToken]];

      // Get expected output amount
      const amounts = await this.router.getAmountsOut(amountIn, path);
      const amountOutMin = amounts[1].mul(95).div(100); // 5% slippage tolerance

      // Approve router to spend tokens
      console.log('Approving token spend...');
      const approveTx = await fromTokenContract.approve(ROUTER_ADDRESS, amountIn);
      await approveTx.wait();
      console.log('Approval confirmed');

      // Execute swap
      console.log('Executing swap...');
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
      const swapTx = await this.router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        wallet.address,
        deadline,
        { gasLimit: 300000 }
      );
      console.log('Waiting for swap confirmation...');
      const receipt = await swapTx.wait();
      console.log('Swap confirmed:', receipt.hash);

      return {
        status: 'completed',
        hash: receipt.hash,
        from: fromToken,
        to: toToken
      };
    } catch (error) {
      console.error('Swap error:', error);
      return {
        status: 'failed',
        error: error.message,
        from: fromToken,
        to: toToken
      };
    }
  }

  async getRandomSwapPair(currentToken?: string) {
    const tokens = ['USDT', 'WETH', 'WBTC'].filter(t => t !== currentToken);
    const randomIndex = Math.floor(Math.random() * tokens.length);
    return tokens[randomIndex];
  }
}