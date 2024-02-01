const ethers = require("ethers");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    var WALLET_NAMES = process.env.WALLET_NAMES;
    var arrayNames = JSON.parse(WALLET_NAMES);

    const baseDir = path.join(__dirname, "wallets");

    for (let i = 0; i < arrayNames.length; i++) {
        var outputDir = path.join(baseDir, arrayNames[i]);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const wallet = ethers.Wallet.createRandom();
        console.log("Generating files for: " + arrayNames[i]);
        fs.writeFile(outputDir + "/address.txt", wallet.address, function (err) {
            if (err) throw err;
        });
        fs.writeFile(outputDir + "/private_key.txt", wallet._signingKey().privateKey, function (err) {
            if (err) throw err;
        });
        fs.writeFile(outputDir + "/mnemonic.txt", wallet._mnemonic().phrase, function (err) {
            if (err) throw err;
        });
        
        const keystoreJson = await wallet.encrypt("password");
        fs.writeFile(outputDir + "/" + arrayNames[i] + ".keystore", keystoreJson, function (err) {
            if (err) throw err;
        })
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});