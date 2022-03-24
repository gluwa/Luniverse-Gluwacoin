const hre = require('hardhat');
const spawn = require('child_process').spawn

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.network;

  // Get account balance
  const balance = await deployer.getBalance();
  console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
  console.log('\x1b[32m%s\x1b[0m', 'Account address: ', deployer.address);
  console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', balance.toString());
}
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});