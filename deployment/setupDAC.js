const { ethers } = require('hardhat');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const deployOutput = require('./deploy_output.json');
const dataCommitteeContractJson = require('../compiled-contracts/CDKDataCommittee.json');
const deployParameters = require('./deploy_parameters.json');

async function main() {
    // Load provider
    let currentProvider = ethers.provider;
    if (deployParameters.multiplierGas || deployParameters.maxFeePerGas) {
        if (process.env.HARDHAT_NETWORK !== 'hardhat') {
            currentProvider = new ethers.providers.JsonRpcProvider(`https://${process.env.HARDHAT_NETWORK}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
            if (deployParameters.maxPriorityFeePerGas && deployParameters.maxFeePerGas) {
                console.log(`Hardcoded gas used: MaxPriority${deployParameters.maxPriorityFeePerGas} gwei, MaxFee${deployParameters.maxFeePerGas} gwei`);
                const FEE_DATA = {
                    maxFeePerGas: ethers.utils.parseUnits(deployParameters.maxFeePerGas, 'gwei'),
                    maxPriorityFeePerGas: ethers.utils.parseUnits(deployParameters.maxPriorityFeePerGas, 'gwei'),
                };
                currentProvider.getFeeData = async () => FEE_DATA;
            } else {
                console.log('Multiplier gas used: ', deployParameters.multiplierGas);
                async function overrideFeeData() {
                    const feedata = await ethers.provider.getFeeData();
                    return {
                        maxFeePerGas: feedata.maxFeePerGas.mul(deployParameters.multiplierGas).div(1000),
                        maxPriorityFeePerGas: feedata.maxPriorityFeePerGas.mul(deployParameters.multiplierGas).div(1000),
                    };
                }
                currentProvider.getFeeData = overrideFeeData;
            }
        }
    }

    // Load deployer
    let deployer;
    if (deployParameters.deployerPvtKey) {
        deployer = new ethers.Wallet(deployParameters.deployerPvtKey, currentProvider);
        console.log('Using pvtKey deployer with address: ', deployer.address);
    } else if (process.env.MNEMONIC) {
        deployer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC, 'm/44\'/60\'/0\'/0/0').connect(currentProvider);
        console.log('Using MNEMONIC deployer with address: ', deployer.address);
    } else {
        [deployer] = (await ethers.getSigners());
    }

    const dataCommitteeContractAddress = deployOutput["cdkDataCommitteeContract"];
    if (dataCommitteeContractAddress === undefined || dataCommitteeContractAddress === '') {
        throw new Error(`Missing DataCommitteeContract: ${deployOutput}`);
    }
    const dacUrls = JSON.parse(process.env.DAC_URL_LIST);
    console.log('DAC_URL:', dacUrls);
    const dacAddresses = JSON.parse(process.env.DAC_ADDRESS_LIST);
    console.log('DAC_ADDRESS:', dacAddresses);
    let addrsBytes = "0x";
    for (let i = 0; i < dacAddresses.length; i++) {
        addrsBytes += dacAddresses[i].slice(2);
    }
    console.log("addrBytes:", addrsBytes)
    const requiredAmountOfSignatures = process.env.REQUIRED_AMOUNT_OF_SIGNATURES;
    console.log("REQUIRED_AMOUNT_OF_SIGNATURES:", requiredAmountOfSignatures);

    const dataCommitteeContract = new ethers.Contract(dataCommitteeContractAddress, dataCommitteeContractJson.abi, deployer);

    const tx = await dataCommitteeContract.setupCommittee(requiredAmountOfSignatures, dacUrls, addrsBytes);
    console.log('Transaction hash:', tx.hash);
    // Wait for receipt
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    dac = {
        urls: dacUrls,
        addresses: dacAddresses,
        requiredAmountOfSignatures: requiredAmountOfSignatures,
    }
    fs.writeFileSync(path.join(__dirname, 'dac.json'), JSON.stringify(dac, null, 4));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });