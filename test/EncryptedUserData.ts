import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

import { EncryptedUserData__factory, EncryptedUserData } from "../types";

type Signers = {
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedUserData")) as EncryptedUserData__factory;
  const contract = (await factory.deploy()) as EncryptedUserData;
  const address = await contract.getAddress();
  return { contract, address };
}

describe("EncryptedUserData", function () {
  let signers: Signers;
  let contract: EncryptedUserData;
  let address: string;

  before(async function () {
    const [a, b] = await ethers.getSigners();
    signers = { alice: a, bob: b };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }
    ({ contract, address } = await deployFixture());
  });

  it("register and read encrypted user fields", async function () {
    const inBuf = await fhevm
      .createEncryptedInput(address, signers.alice.address)
      .add32(86) // country
      .add32(1001) // city
      .add64(BigInt(100000)) // salary
      .add16(1995) // birthYear
      .encrypt();

    await (await contract.connect(signers.alice).register("alice", inBuf.handles[0], inBuf.handles[1], inBuf.handles[2], inBuf.handles[3], inBuf.inputProof)).wait();

    const [, eCountry, eCity, eSalary, eBirth, registered] = await contract.getUser(signers.alice.address);
    expect(registered).to.eq(true);

    const cCountry = await fhevm.userDecryptEuint(FhevmType.euint32, eCountry, address, signers.alice);
    const cCity = await fhevm.userDecryptEuint(FhevmType.euint32, eCity, address, signers.alice);
    const cSalary = await fhevm.userDecryptEuint(FhevmType.euint64, eSalary, address, signers.alice);
    const cBirth = await fhevm.userDecryptEuint(FhevmType.euint16, eBirth, address, signers.alice);
    expect(cCountry).to.eq(86);
    expect(cCity).to.eq(1001);
    expect(cSalary).to.eq(100000n);
    expect(cBirth).to.eq(1995);
  });

  it("apply with constraints and get encrypted result", async function () {
    // Alice registers
    const inBuf = await fhevm
      .createEncryptedInput(address, signers.alice.address)
      .add32(1)
      .add32(2)
      .add64(BigInt(123456))
      .add16(1990)
      .encrypt();
    await (await contract.connect(signers.alice).register("alice", inBuf.handles[0], inBuf.handles[1], inBuf.handles[2], inBuf.handles[3], inBuf.inputProof)).wait();

    // Bob creates an app requiring country=1 and maxSalary >= 120000, birth year between 1980 and 2000
    const tx = await contract.connect(signers.bob).createApplication(1, 0, 120000, 0, 1980, 2000);
    const receipt = await tx.wait();
    const appId = 0; // first app

    // Alice applies
    await (await contract.connect(signers.alice).submitApplication(appId)).wait();
    const res = await contract.getApplicationResult(appId, signers.alice.address);

    const clear = await fhevm.userDecryptEbool(res, address, signers.alice);
    expect(clear).to.eq(true);
  });
});
