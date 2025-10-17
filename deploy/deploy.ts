import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("EncryptedUserData", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedUserData: `, deployed.address);
};
export default func;
func.id = "deploy_encrypted_user_data"; // id required to prevent reexecution
func.tags = ["EncryptedUserData"];
