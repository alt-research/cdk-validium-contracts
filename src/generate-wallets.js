const ethers = require("ethers");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    var password = process.env.PASSWORD || 'password';

    let nodeKeyNames;
    try {
        nodeKeyNames = JSON.parse(process.env.NODE_KEY_NAMES);
    } catch (e) {
        nodeKeyNames = []; 
    }

    let dacKeyNames;
    try {
        dacKeyNames = JSON.parse(process.env.DAC_KEY_NAMES);
    } catch (e) {
        dacKeyNames = [];  
    }

    const baseDir = path.join(__dirname, "wallets");

    var nodeAddresses = {};
    for (let i = 0; i < nodeKeyNames.length; i++) {
        var subDir = path.join(baseDir, nodeKeyNames[i]);
        if (fs.existsSync(subDir)) {
            continue
        }
        fs.mkdirSync(subDir, { recursive: true });
        const wallet = await generateWallet(subDir, nodeKeyNames[i], password);
        nodeAddresses[nodeKeyNames[i]] = wallet.address;
    }

    fs.writeFile(baseDir + "/node_addresses.json", JSON.stringify(nodeAddresses, null, 4), function (err) {
        if (err) throw err;
    });

    var dacAddresses = [];
    for (let i = 0; i < dacKeyNames.length; i++) {
        var subDir = path.join(baseDir, dacKeyNames[i]);
        if (fs.existsSync(subDir)) {
            continue
        }
        fs.mkdirSync(subDir, { recursive: true });
        const wallet = await generateWallet(subDir, dacKeyNames[i], password);
        dacAddresses.push(wallet.address);
    }
    if (dacAddresses.length > 0) {
        fs.writeFile(baseDir + "/dac_addresses.json", JSON.stringify(dacAddresses), function (err) {
            if (err) throw err;
        });
    }
}

async function generateWallet(dir, name, password) {
    const wallet = ethers.Wallet.createRandom();
    console.log("Generating wallet for: " + name);
    fs.writeFile(dir + "/address.txt", wallet.address, function (err) {
        if (err) throw err;
    });
    fs.writeFile(dir + "/private_key.txt", wallet._signingKey().privateKey, function (err) {
        if (err) throw err;
    });
    fs.writeFile(dir + "/mnemonic.txt", wallet._mnemonic().phrase, function (err) {
        if (err) throw err;
    });
    const keystoreJson = await wallet.encrypt(password);
    fs.writeFile(dir + "/" + name + ".keystore", keystoreJson, function (err) {
        if (err) throw err;
    })
    return wallet
}


main().catch((e) => {
    console.error(e);
    process.exit(1);
});