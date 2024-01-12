const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const deployOutput = require('./deploy_output.json');
const genesis = require('./genesis.json');

async function main() {
    l1ChainId = Number(process.env.L1_CHAIN_ID)
    if (!Number.isInteger(l1ChainId)) {
        throw new Error('env L1_CHAIN_ID is not an integer');
    }
    const deploymentBlockNumber = deployOutput.deploymentBlockNumber;
    genesis.genesisBlockNumber = deploymentBlockNumber;
    console.log('#######################\n');
    console.log('genesisBlockNumber set to:', deploymentBlockNumber);

    genesis.l1Config = {
        chainId: l1ChainId,
        cdkValidiumAddress: deployOutput.cdkValidiumAddress,
        maticTokenAddress: deployOutput.maticTokenAddress,
        polygonZkEVMGlobalExitRootAddress: deployOutput.polygonZkEVMGlobalExitRootAddress,
        cdkDataCommitteeContract: deployOutput.cdkDataCommitteeContract
    }
    console.log('#######################\n');
    console.log('l1Config set to:', genesis.l1Config);

    fs.writeFileSync(path.join(__dirname, 'genesis.json'), JSON.stringify(genesis, null, 4));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
