import axios from "axios";
import { encrypt } from "@metamask/eth-sig-util";
import { ethers } from "ethers";
import { create } from "ipfs-http-client";
import { AuthenticateOptions } from "react-moralis/lib/hooks/core/useMoralis/_useMoralisAuth";
import abi from "./abi.json";
import rinkebyAbi from "./rinkebyAbi.json";

declare let window: any;

export const handleAuth = async (authenticate) => {
	const options: AuthenticateOptions = {
		signingMessage: `Connect with Dakiya`,
		chainId: process.env.NODE_ENV === "development" ? 4 : 1,
	};

	if (!(window as any).ethereum) {
		options.provider = "walletconnect";
	}

	await authenticate(options);
};

export const checkIfWalletIsConnected = async (): Promise<string> => {
	try {
		if (!window) {
			throw new Error("No window object");
		}

		const { ethereum } = window;

		if (!ethereum) {
			console.log("Make sure you have metamask!");
			return;
		} else {
			console.log("We have the ethereum object");
		}

		/*
		 * Check if we're authorized to access the user's wallet
		 */

		let chainId = await ethereum.request({ method: "eth_chainId" });

		// String, hex code of the chainId of the Rinkebey test network
		// const rinkebyChainId = "0x4";
		const mainnetChainId = "0x1";
		if (chainId !== mainnetChainId) {
			throw new Error("Please connect to the mainnet");
		}

		const accounts = await ethereum.request({ method: "eth_accounts" });

		/*
		 * User can have multiple authorized accounts, we grab the first one if its there!
		 */

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log("Found an authorized account:", account);
			return account;
		} else {
			console.log("No authorized account found");
		}
	} catch (error) {
		console.error(error);
	}
};

export const connectWallet = async () => {
	try {
		if (!window) {
			throw new Error("No window object");
		}

		const { ethereum } = window;

		if (!ethereum) {
			alert("Get MetaMask!");
			return;
		}

		/*
		 * Fancy method to request access to account.
		 */

		// let chainId = await ethereum.request({ method: "eth_chainId" });
		// console.log(chainId);
		// console.log("Connected to chain " + chainId);

		// // String, hex code of the chainId of the Rinkebey test network
		// const rinkebyChainId = "0x4";
		// if (chainId !== rinkebyChainId) {
		// 	alert("You are not connected to the Rinkeby Test Network!");
		// 	throw new Error(
		// 		"You are not connected to the Rinkeby Test Network!"
		// 	);
		// }

		const accounts = await ethereum.request({
			method: "eth_requestAccounts",
		});

		/*
		 * Boom! This should print out public address once we authorize Metamask.
		 */
		console.log({ accounts });
		console.log("Connected", accounts[0]);

		return accounts[0];
	} catch (error) {
		console.log(error);
	}
};

export const sendTransaction = async (
	addr: string,
	message: string,
	ether: string
) => {
	await window.ethereum.send("eth_requestAccounts");
	console.log("here", ethers);
	const provider = new ethers.providers.Web3Provider(window.ethereum);
	console.log({ provider });
	const signer = provider.getSigner();
	ethers.utils.getAddress(addr);
	console.log({ signer });
	const hexaMessage = ethers.utils.formatBytes32String(message);
	console.log({ hexaMessage });
	const tx = await signer.sendTransaction({
		to: addr,
		value: ethers.utils.parseEther(ether),
		data: hexaMessage,
	});

	return tx;
};

export interface ENSResponse {
	address?: string | null;
	name?: string | null;
	avatar?: string | null;
	error?: string | null;
}
export const validateAndResolveAddress = async (
	userAddress: string,
	provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider
): Promise<ENSResponse | undefined> => {
	try {
		let address, name, avatar;

		if (userAddress.includes(".")) {
			const ensResolver = await provider.resolveName(userAddress);

			if (!ensResolver) {
				// toast.error("This address is not valid");
				// throw new Error("This address is not valid");
				console.warn("No ens resolver found for this address");
				return;
			}

			address = ensResolver;
			name = userAddress;
		}

		if (!userAddress.includes(".")) {
			ethers.utils.getAddress(userAddress);

			name = await provider.lookupAddress(userAddress);

			address = userAddress;
		}

		if (name) {
			avatar = await provider.getAvatar(name);
		}

		return { address, name, avatar };
	} catch (error) {
		console.error(error);
		return {};
	}
};

const rinkebyCheck =
	process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_RINKEBY;

const contractAddress = rinkebyCheck
	? "0x355039B35222ea3E5eCbddfa0400BfC78E1ACEEf"
	: "0x0761e0a5795be98fe806fa741a88f94ebec76c2b"; // eth mainnet

const contractABI = rinkebyCheck ? rinkebyAbi : abi;

export const listenEvents = () => {
	const provider = new ethers.providers.Web3Provider(window.ethereum);

	const { ethereum } = window;
	if (ethereum) {
		const contractReader = new ethers.Contract(
			contractAddress,
			contractABI,
			provider
		);
		return contractReader;
	}
};

export const contract = () => {
	const provider = new ethers.providers.Web3Provider(window.ethereum);

	const { ethereum } = window;
	if (ethereum) {
		const signer = provider.getSigner();
		const contractReader = new ethers.Contract(
			contractAddress,
			contractABI,
			signer
		);
		return contractReader;
	}
};

export const getPublicEncryptionKey = async (
	account: string
): Promise<string | null> => {
	const { ethereum } = window;

	if (ethereum) {
		const pubEncryptionKey = await ethereum.request({
			method: "eth_getEncryptionPublicKey",
			params: [account],
		});

		return pubEncryptionKey;
	}

	return null;
};

export const encryptMessage = async (
	message: string,
	publicKey: string
): Promise<string> => {
	const encryptedData = encrypt({
		publicKey,
		data: message,
		version: "x25519-xsalsa20-poly1305",
	});
	const hexValue = ethers.utils.hexlify(
		Buffer.from(JSON.stringify(encryptedData))
	);
	return hexValue;
};

export const decryptMessage = async (cipherText: string): Promise<string> => {
	const { ethereum } = window;

	if (ethereum) {
		const decryptedData = await ethereum.request({
			method: "eth_decrypt",
			params: [cipherText, ethereum.selectedAddress],
		});
		return decryptedData;
	}
};

export const ipfs = create({
	host: "ipfs.infura.io",
	port: 5001,
	protocol: "https",
});

export const uploadToIPFS = async (message: string): Promise<string> => {
	console.log({ message });
	const resFile = await axios({
		method: "post",
		url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
		data: JSON.stringify({ message }),
		headers: {
			pinata_api_key: `${process.env.NEXT_PUBLIC_PINATA_API_KEY}`,
			pinata_secret_api_key: `${process.env.NEXT_PUBLIC_PINATA_API_SECRET}`,
			"Content-Type": "application/json",
		},
	});

	return resFile.data.IpfsHash;
};

export const fetchFromIPFS = async (
	uri: string,
	message?: boolean
): Promise<string> => {
	console.log({ uri });
	const result = await fetch(`https://ipfs.io/ipfs/${uri}`);
	const jsonData = await result.text();

	if (message) {
		return jsonData;
	}

	let ipfsData = jsonData;

	try {
		ipfsData = JSON.parse(jsonData)?.message;
	} catch (error) {}

	return ipfsData;
};
