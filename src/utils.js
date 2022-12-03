import hasFlag from 'has-flag';
import fs from 'fs';

export const isNullOrUndef = (val) => {
	let isNotValid = false
	if(val == null || val == undefined){
		isNotValid = true
	}

	return isNotValid
}

export const logFileKeyvaultAndSql = (fileName, key, username, value) => {
	var logger = fs.createWriteStream(`logs/${fileName}`, {
		flags: 'a' // 'a' means appending (old data will be preserved)
	})

	if(!isNullOrUndef(key) && !isNullOrUndef(value)){
		logger.write(`${key}='${value}', ${username}='${value}' \n`);
	}
}

export const logFileKeyvaultOnly = (fileName, key, value) => {
	var logger = fs.createWriteStream(`logs/${fileName}`, {
		flags: 'a' // 'a' means appending (old data will be preserved)
	})

	if(!isNullOrUndef(key) && !isNullOrUndef(value)){
		logger.write(`${key}='${value}' \n`);
	}
}

export const consoleLogInsertionInKeyvaultAndSql = (key, username) => {
	console.log(`${key} changed correctly on Keyvault.`)
	console.log(`${username} changed correctly on database.`)
}

export const consoleLogInsertionInKeyvaultOnly = (key) => {
	console.log(`${key} changed correctly on Keyvault.`)
}

export const randomString = ( passwordLength ) => {
	var chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var password = "";
	for (var i = 0; i <= passwordLength; i++) {
		var randomNumber = Math.floor(Math.random() * chars.length);
		password += chars.substring(randomNumber, randomNumber +1);
	}

	return password
}

export const stringContainsText = (originalString, searchedString) => {
	let contains = false;

	if (!isNullOrUndef(text)){
		const result = originalString.includes(searchedString);
		if(result){
			contains = true;
		}
	}

	return contains;
}

export const setValueToVar = (key, args) => {
	let value = null
	if (!isNullOrUndef(key) && !isObjectEmpty(args) && hasFlag(key)){
		let uncheckedValue = args[key]
		value = uncheckedValue.replace(/'/g, '');
	}

	return value;
}

function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}

export const writeSecretToFile = (fileName, value) => {
	let result = false;

	if(!isNullOrUndef(fileName) && !isNullOrUndef(value)){
		var logger = fs.createWriteStream(fileName, {
			flags: 'a' // 'a' means appending (old data will be preserved)
		})

		logger.write(value);
		result = true;
	}

	return result;
}

export const allEnvsAreOk = (values) => {
	let result = true;
	let x = 0;

	if(!isNullOrUndef(values) && values.length > 0){
		while(x < values.length && result){
			const val = values[x];
			if(isNullOrUndef(val)){
				result = false;
			}

			x ++;
		}
	}

	return result;
}

export const setValueInKeyvault = async (keyvaultClient, bdPassKey, newPassword, username, reportFile) => {
	let isValueSetted = false;

	if(!isNullOrUndef(bdPassKey) && !isNullOrUndef(newPassword)){
		let settedValue = await keyvaultClient.setSecret(bdPassKey, newPassword);
		if( !isNullOrUndef(settedValue) && settedValue.value === newPassword){
			isValueSetted = true;
		}
	}

	return isValueSetted;
}

export const setValueInDatabase = async (sql, sqlConfig, username, newPassword) => {
	let isValueSetted = false;
	try {
		await sql.connect(sqlConfig);
		const commandText = `alter LOGIN "${username}" with password=N'${newPassword}'`;
		const result = await sql.query(commandText);
		isValueSetted = true;
	} catch (error) {
		isValueSetted = false;
	}

	return isValueSetted;
}





