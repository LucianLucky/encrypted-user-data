// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint16, euint32, euint64, externalEuint16, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted User Data and Application Matching
/// @notice Stores user data with FHE and evaluates application constraints fully on-chain producing an encrypted result
/// @dev Username is plaintext. Country/city/salary/birthYear are encrypted. All comparisons are done with FHE.
contract EncryptedUserData is SepoliaConfig {
    struct User {
        string username; // plaintext, per requirements
        euint32 country; // encrypted
        euint32 city;    // encrypted
        euint64 salary;  // encrypted
        euint16 birthYear; // encrypted
        bool registered;
    }

    struct Application {
        address creator;
        // Constraints stored as plaintext; converted to encrypted at evaluation time using FHE.asEuintXX
        // If a constraint is 0, it is considered unused/ignored.
        uint32 countryId; // 0 means ignore
        uint32 cityId;    // 0 means ignore
        uint64 minSalary; // 0 means ignore
        uint64 maxSalary; // 0 means ignore
        uint16 minBirthYear; // 0 means ignore
        uint16 maxBirthYear; // 0 means ignore
        bool active;
    }

    mapping(address => User) private users;
    mapping(uint256 => Application) private apps;
    uint256 public nextAppId;

    // applicationId => applicant => encrypted result
    mapping(uint256 => mapping(address => ebool)) private appResults;

    event UserRegistered(address indexed user, string username);
    event ApplicationCreated(uint256 indexed appId, address indexed creator);
    event Applied(uint256 indexed appId, address indexed applicant, ebool result);

    /// @notice Register or update the caller's encrypted user profile
    /// @param username Plaintext username
    /// @param countryExt Encrypted country id input
    /// @param cityExt Encrypted city id input
    /// @param salaryExt Encrypted annual salary input
    /// @param birthYearExt Encrypted birth year input
    /// @param inputProof Zama input proof
    function register(
        string calldata username,
        externalEuint32 countryExt,
        externalEuint32 cityExt,
        externalEuint64 salaryExt,
        externalEuint16 birthYearExt,
        bytes calldata inputProof
    ) external {
        euint32 country = FHE.fromExternal(countryExt, inputProof);
        euint32 city = FHE.fromExternal(cityExt, inputProof);
        euint64 salary = FHE.fromExternal(salaryExt, inputProof);
        euint16 birthYear = FHE.fromExternal(birthYearExt, inputProof);

        // Set ACL for later user decryption
        FHE.allowThis(country);
        FHE.allowThis(city);
        FHE.allowThis(salary);
        FHE.allowThis(birthYear);
        FHE.allow(country, msg.sender);
        FHE.allow(city, msg.sender);
        FHE.allow(salary, msg.sender);
        FHE.allow(birthYear, msg.sender);

        users[msg.sender] = User({
            username: username,
            country: country,
            city: city,
            salary: salary,
            birthYear: birthYear,
            registered: true
        });

        emit UserRegistered(msg.sender, username);
    }

    /// @notice View another user's encrypted data. Does not use msg.sender.
    function getUser(address user)
        external
        view
        returns (
            string memory username,
            euint32 country,
            euint32 city,
            euint64 salary,
            euint16 birthYear,
            bool registered
        )
    {
        User storage u = users[user];
        return (u.username, u.country, u.city, u.salary, u.birthYear, u.registered);
    }

    /// @notice Create an application with optional constraints.
    /// @dev Any 0 value disables the corresponding constraint.
    function createApplication(
        uint32 countryId,
        uint32 cityId,
        uint64 minSalary,
        uint64 maxSalary,
        uint16 minBirthYear,
        uint16 maxBirthYear
    ) external returns (uint256 appId) {
        appId = nextAppId++;
        apps[appId] = Application({
            creator: msg.sender,
            countryId: countryId,
            cityId: cityId,
            minSalary: minSalary,
            maxSalary: maxSalary,
            minBirthYear: minBirthYear,
            maxBirthYear: maxBirthYear,
            active: true
        });
        emit ApplicationCreated(appId, msg.sender);
    }

    /// @notice Get application details by id.
    /// @dev Pure view; no msg.sender usage.
    function getApplication(uint256 appId)
        external
        view
        returns (
            address creator,
            bool active,
            uint32 countryId,
            uint32 cityId,
            uint64 minSalary,
            uint64 maxSalary,
            uint16 minBirthYear,
            uint16 maxBirthYear
        )
    {
        Application storage a = apps[appId];
        return (
            a.creator,
            a.active,
            a.countryId,
            a.cityId,
            a.minSalary,
            a.maxSalary,
            a.minBirthYear,
            a.maxBirthYear
        );
    }

    /// @notice Submit to an application; returns encrypted qualification result and stores it.
    /// @param appId The application id
    /// @return result Encrypted boolean of qualification
    function submitApplication(uint256 appId) external returns (ebool result) {
        Application storage a = apps[appId];
        require(a.active, "Application inactive");
        User storage u = users[msg.sender];
        require(u.registered, "User not registered");

        // Start with true and AND all active conditions
        ebool ok = FHE.asEbool(true);

        if (a.countryId != 0) {
            euint32 requiredCountry = FHE.asEuint32(a.countryId);
            ebool cond = FHE.eq(u.country, requiredCountry);
            ok = FHE.and(ok, cond);
        }

        if (a.cityId != 0) {
            euint32 requiredCity = FHE.asEuint32(a.cityId);
            ebool cond = FHE.eq(u.city, requiredCity);
            ok = FHE.and(ok, cond);
        }

        if (a.minSalary != 0) {
            euint64 minS = FHE.asEuint64(a.minSalary);
            ebool cond = FHE.ge(u.salary, minS);
            ok = FHE.and(ok, cond);
        }

        if (a.maxSalary != 0) {
            euint64 maxS = FHE.asEuint64(a.maxSalary);
            ebool cond = FHE.le(u.salary, maxS);
            ok = FHE.and(ok, cond);
        }

        if (a.minBirthYear != 0) {
            euint16 minB = FHE.asEuint16(a.minBirthYear);
            ebool cond = FHE.ge(u.birthYear, minB);
            ok = FHE.and(ok, cond);
        }

        if (a.maxBirthYear != 0) {
            euint16 maxB = FHE.asEuint16(a.maxBirthYear);
            ebool cond = FHE.le(u.birthYear, maxB);
            ok = FHE.and(ok, cond);
        }

        // Store and set ACL
        appResults[appId][msg.sender] = ok;
        FHE.allowThis(ok);
        FHE.allow(ok, msg.sender);
        FHE.allow(ok, a.creator);

        emit Applied(appId, msg.sender, ok);
        return ok;
    }

    /// @notice Get the encrypted application result for a user without using msg.sender in view context.
    function getApplicationResult(uint256 appId, address user) external view returns (ebool) {
        return appResults[appId][user];
    }
}
