import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("user:address", "Prints the EncryptedUserData address").setAction(async (_args, hre) => {
  const d = await hre.deployments.get("EncryptedUserData");
  console.log(`EncryptedUserData: ${d.address}`);
});

task("user:register", "Register user with encrypted fields")
  .addParam("username", "username (plaintext)")
  .addParam("country", "country id (number)")
  .addParam("city", "city id (number)")
  .addParam("salary", "annual salary (number)")
  .addParam("year", "birth year (number)")
  .setAction(async (args: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;
    await fhevm.initializeCLIApi();
    const d = await deployments.get("EncryptedUserData");
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("EncryptedUserData", d.address);

    const inBuf = await fhevm
      .createEncryptedInput(d.address, signer.address)
      .add32(parseInt(args.country))
      .add32(parseInt(args.city))
      .add64(BigInt(args.salary))
      .add16(parseInt(args.year))
      .encrypt();

    const tx = await contract
      .connect(signer)
      .register(args.username, inBuf.handles[0], inBuf.handles[1], inBuf.handles[2], inBuf.handles[3], inBuf.inputProof);
    console.log(`tx: ${tx.hash}`);
    await tx.wait();
  });

task("app:create", "Create application with constraints (0 to ignore)")
  .addParam("country", "country id, 0 to ignore")
  .addParam("city", "city id, 0 to ignore")
  .addParam("minsalary", "min salary, 0 to ignore")
  .addParam("maxsalary", "max salary, 0 to ignore")
  .addParam("minyear", "min birth year, 0 to ignore")
  .addParam("maxyear", "max birth year, 0 to ignore")
  .setAction(async (args: TaskArguments, hre) => {
    const { deployments, ethers } = hre;
    const d = await deployments.get("EncryptedUserData");
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("EncryptedUserData", d.address);
    const tx = await contract
      .connect(signer)
      .createApplication(
        parseInt(args.country),
        parseInt(args.city),
        BigInt(args.minsalary),
        BigInt(args.maxsalary),
        parseInt(args.minyear),
        parseInt(args.maxyear),
      );
    const receipt = await tx.wait();
    console.log(`Created app, tx: ${tx.hash}`);
    console.log(`Logs: ${JSON.stringify(receipt?.logs?.length)}`);
  });

task("app:apply", "Apply to application id and decrypt result")
  .addParam("id", "application id")
  .setAction(async (args: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;
    await fhevm.initializeCLIApi();
    const d = await deployments.get("EncryptedUserData");
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("EncryptedUserData", d.address);
    const tx = await contract.connect(signer).submitApplication(parseInt(args.id));
    const receipt = await tx.wait();
    const event = receipt?.logs?.[0];
    console.log(`Applied, tx: ${tx.hash}`);

    const encryptedRes = await contract.getApplicationResult(parseInt(args.id), signer.address);
    const clear = await fhevm.userDecryptEbool(encryptedRes, d.address, signer);
    console.log(`Encrypted result: ${encryptedRes}`);
    console.log(`Clear result: ${clear}`);
  });
