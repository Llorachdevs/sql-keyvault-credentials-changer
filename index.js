#! /usr/bin/env node
import {
    setValueToVar, 
    allEnvsAreOk,
    isNullOrUndef,
    logFileKeyvaultAndSql,
    logFileKeyvaultOnly,
    randomString,
    consoleLogInsertionInKeyvaultAndSql,
    consoleLogInsertionInKeyvaultOnly
} from "./src/utils.js";

import { SecretClient } from "@azure/keyvault-secrets";
import { AzureCliCredential } from "@azure/identity";
import commandLineArgs from 'command-line-args';
import sql from "mssql"

// const optionDefinitions = [
//     { name: 'PASSWORD_KEY_PATTERN', type: String },
//     { name: 'USERNAME_KEY_PATTERN', type: String },    
//     { name: 'KEY_VALUE', type: String },
//     { name: 'REPORT_FILE', type: String },
//     { name: 'VAULT', type: String },
//     { name: 'TENNANT_ID', type: String },
//     { name: 'CLIENT_ID', type: String },
//     { name: 'CLIENT_SECRET', type: String },
//     { name: 'RANDOM_SECRET_ENABLED', type: Boolean, defaultOption: false },
//     { name: 'RANDOM_SECRET_SIZE', type: Number, defaultOption: 0 },
//     { name: 'SQL_INSERTION_ENABLE', type: Boolean, defaultOption: false }, 
//     { name: 'SQL_USER', type: String, defaultOption: "" },
//     { name: 'SQL_PASSWORD', type: String, defaultOption: "" },
//     { name: 'SQL_SERVER', type: String, defaultOption: "" },
//     { name: 'SQL_DATABASE', type: String, defaultOption: "" },
//     { name: 'SQL_PORT', type: String, defaultOption: "" },
// ];

// const options = commandLineArgs(optionDefinitions)

// const passwordKeyPattern = setValueToVar("PASSWORD_KEY_PATTERN", options);
// const usernameKeyPattern = setValueToVar("USERNAME_KEY_PATTERN", options);
// const keyValue = setValueToVar("KEY_VALUE", options);
// const reportFile = setValueToVar("REPORT_FILE", options);
// const tenantId = setValueToVar("TENNANT_ID", options);
// const clientId = setValueToVar("CLIENT_ID", options);
// const clientSecret = setValueToVar("CLIENT_SECRET", options);
// const keyVaultName = setValueToVar("VAULT", options);
// const randomSecretEnabled = setValueToVar("RANDOM_SECRET_ENABLED", options);
// const randomSecretSize = setValueToVar("RANDOM_SECRET_SIZE", options);
// const sqlInsertionEnable = setValueToVar("SQL_INSERTION_ENABLE", options);
// const sqlUser = setValueToVar("SQL_USER", options);
// const sqlPassword = setValueToVar("SQL_PASSWORD", options);
// const sqlServer = setValueToVar("SQL_SERVER", options);
// const sqlDatabase = setValueToVar("SQL_DATABASE", options);
// const sqlPort = setValueToVar("SQL_PORT", options);

const passwordKeyPattern = process.env.PASSWORD_KEY_PATTERN;
const usernameKeyPattern = process.env.USERNAME_KEY_PATTERN;
const keyValue = process.env.KEY_VALUE;
const reportFile = process.env.REPORT_FILE;
const tenantId = process.env.TENNANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const keyVaultName = process.env.VAULT;
const randomSecretEnabled = process.env.RANDOM_SECRET_ENABLED === 'true';
const randomSecretSize = parseInt(process.env.RANDOM_SECRET_SIZE, 10);
const sqlInsertionEnable = proces.env.SQL_INSERTION_ENABLE === 'true';
const sqlUser = proces.env.SQL_USER;
const sqlPassword = process.env.SQL_PASSWORD;
const sqlServer = proces.env.SQL_SERVER;
const sqlDatabase = process.env.SQL_DATABASE;
const sqlPort = parseInt(process.env.SQL_PORT, 10);

const envsAreOk = allEnvsAreOk([
    passwordKeyPattern, 
    usernameKeyPattern, 
    keyValue, reportFile, 
    tenantId, 
    clientId, 
    clientSecret, 
    keyVaultName, 
    randomSecretEnabled, 
    randomSecretSize, 
    sqlInsertionEnable, 
    sqlUser, 
    sqlPassword, 
    sqlServer, 
    sqlDatabase]);

if(envsAreOk){
    const keyvualtCredential = new AzureCliCredential(tenantId, clientId, clientSecret, keyVaultName);
    const keyvaultUrl = "https://" + keyVaultName + ".vault.azure.net";
    const keyvaultClient = new SecretClient(keyvaultUrl, keyvualtCredential);
    console.log("Keyvault:", keyvaultUrl);

    var sqlConfig = null;

    if(sqlInsertionEnable){
        sqlConfig = {
            port: sqlPort,
            server: sqlServer,
            user: sqlUser,
            password: sqlPassword,
            database: sqlDatabase,
            stream: false,
            options: {
                trustedConnection: true,
                encrypt: true,
                enableArithAbort: true,
                trustServerCertificate: true,
            }
        }
    }

    let processValid = true;

        (async () => {
                for await (let secretProperties of keyvaultClient.listPropertiesOfSecrets()) {
                    const keyName = secretProperties.name;

                    try {
                        if(keyName.includes(usernameKeyPattern)){
                            const username = (await keyvaultClient.getSecret(keyName)).value;
                            const bdPassKey = keyName.replace(usernameKeyPattern, passwordKeyPattern);

                            let newPassword = null;

                            if(randomSecretEnabled){
                                newPassword = randomString(randomSecretSize);
                            }else {
                                newPassword = keyValue;
                            }

                            if( bdPassKey.includes(passwordKeyPattern)){
                                if (!isNullOrUndef(newPassword)){
                                    if(sqlInsertionEnable){
                                        try {
                                            const isValueSettedInDatabase = await setValueInDatabase(sql, sqlConfig, username, newPassword);
                                            let isValueSettedInKeyvault = false;
                                            if(isValueSettedInDatabase){
                                                isValueSettedInKeyvault = await setValueInKeyvault(keyvaultClient, bdPassKey, newPassword, username, reportFile);
                                            }
                                            
                                            if(isValueSettedInDatabase && isValueSettedInKeyvault){
                                                consoleLogInsertionInKeyvaultAndSql(bdPassKey, username);
                                                logFileKeyvaultAndSql(reportFile, bdPassKey, username, newPassword); 
                                            }
                                        } catch (error) {
                                            // TODO: Create and error log
                                            console.log(error);
                                            processValid = false;
                                        }
                                    }else {
                                        const isValueSettedInKeyvault = await setValueInKeyvault(keyvaultClient, bdPassKey, newPassword, username, reportFile);
                                        if(isValueSettedInKeyvault){
                                            consoleLogInsertionInKeyvaultOnly(bdPassKey);
                                            logFileKeyvaultOnly(reportFile, bdPassKey, bdPassKey);
                                        }
                                    }
                                }
                            }
                        }
                    }catch (error) {
                        // TODO: Create and error log
                        console.log(error);
                        processValid = false;
                    }
                }

                if(processValid){
                    console.log(`All Keys from ${keyVaultName} and the database were changed correctly.`)
                }
        })();
}else{
    console.error("Invalid arguments");
}
