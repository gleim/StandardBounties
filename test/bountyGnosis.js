// bounty test dependencies
const StandardBounties = artifacts.require("../contracts/StandardBounties");
const HumanStandardToken = artifacts.require("../contracts/inherited/HumanStandardToken");
const utils = require('./helpers/Utils');

// gnosis test dependencies
const assert = require("assert");
const _ = require("lodash");
const Gnosis = require("@gnosis.pm/gnosisjs");
const TestRPC = require("ethereumjs-testrpc");

// gnosis configuration
const options = process.env.GNOSIS_OPTIONS ? JSON.parse(process.env.GNOSIS_OPTIONS) : null

const description = {
    title: 'Will Bitcoin Hardfork before 2018',
    description: 'Hello world',
    resolutionDate: new Date().toISOString(),
    outcomes: ['Yes', 'No']
}

async function requireRejection(q, msg) {
    try {
        await q
    } catch(e) {
        return e
    }
    throw new Error(msg || 'promise did not reject')
}

// test
contract('BountyGnosis', function(accounts) {

  it("[ETH/TOKEN] Verifies that I can issue new bounties paying in both ETH and Tokens", async () => {

    // create Bounty registry owned by User 0
    let registry = await StandardBounties.new(accounts[0]);

    // create Token type BOUNT owned by User 0
    // one billion tokens
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    for (var i = 0; i < 100; i++){
      if (i % 2){
        await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    true,
                                    bountyToken.address, {from: accounts[0]});
        let data = await registry.getBountyData(i);
        let bounty = await registry.getBounty(i);
        let tokenAddress = await registry.getBountyToken(i);
        assert(bounty[3] == true);
        assert(tokenAddress == bountyToken.address)
        assert(data == ("data"+i));
      } else {

        await registry.issueBounty(0xF633f5bAf5954eE8F357055FE5151DDc27EEfdBF,
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    false,
                                    0x0, {from: accounts[0]});
        let data = await registry.getBountyData(i);
        let bounty = await registry.getBounty(i);
        let tokenAddress = await registry.getBountyToken(i);
        assert(bounty[3] == false);
        assert(tokenAddress == "0x0000000000000000000000000000000000000000")
        assert(data == ("data"+i));

      }
    }
  });

  it("[ETH/TOKEN] Verifies that I can issue, activate, fulfill, accept, and pay out new bounties paying in both ETH and Tokens", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    for (var i = 0; i < 100; i++){
      if (i % 2){
        await registry.issueBounty(accounts[0],
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    true,
                                    bountyToken.address,{from: accounts[0]});

        await bountyToken.approve(registry.address, 1000, {from: accounts[0]});

        await registry.activateBounty(i,1000, {from: accounts[0]});

        await registry.fulfillBounty(i, "data", {from: accounts[1]});

        await registry.acceptFulfillment(i,0,{from: accounts[0]});

        await registry.fulfillmentPayment(i,0,{from: accounts[1]});
        var bounty = await registry.getBounty(i);
        assert(bounty[6] == 0);


      } else {

        await registry.issueBounty(accounts[0],
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    false,
                                    0x0,{from: accounts[0]});

        await registry.activateBounty(i,1000, {from: accounts[0], value: 1000});

        await registry.fulfillBounty(i, "data", {from: accounts[1]});

        await registry.acceptFulfillment(i,0,{from: accounts[0]});

        await registry.fulfillmentPayment(i,0,{from: accounts[1]});
        var bounty = await registry.getBounty(i);
        assert(bounty[6] == 0);



      }
    }
  });

  it("[ETH/TOKEN] Verifies that I can issue, activate, fulfill, accept, and pay out new bounties paying in both ETH and Tokens from various addresses, with various token contracts", async () => {

    let registry = await StandardBounties.new(accounts[0]);
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    await bountyToken.transfer(accounts[1], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[2], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[3], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[4], 100000000, {from: accounts[0]});
    await bountyToken.transfer(accounts[5], 100000000, {from: accounts[0]});

    let bountyToken2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2", {from: accounts[0]});

    await bountyToken2.transfer(accounts[1], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[2], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[3], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[4], 100000000, {from: accounts[0]});
    await bountyToken2.transfer(accounts[5], 100000000, {from: accounts[0]});

    for (var i = 0; i < 100; i++){
      if (i % 2){
        if (i % 4){
          await registry.issueBounty(accounts[(i%5)],
                                      2528821098,
                                      "data"+i,
                                      1000,
                                      0x0,
                                      true,
                                      bountyToken.address,{from: accounts[(i%5)]});
          await bountyToken.approve(registry.address, 1000, {from: accounts[(i%5)]});

          await registry.activateBounty(i,1000, {from: accounts[(i%5)]});

          await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});

          await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});

          await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
          var bounty = await registry.getBounty(i);
          assert(bounty[6] == 0);
        } else {
          await registry.issueBounty(accounts[(i%5)],
                                      2528821098,
                                      "data"+i,
                                      1000,
                                      0x0,
                                      true,
                                      bountyToken2.address,{from: accounts[(i%5)]});
          await bountyToken.approve(registry.address, 1000, {from: accounts[(i%5)]});

          await registry.activateBounty(i,1000, {from: accounts[(i%5)]});

          await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});

          await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});

          await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
          var bounty = await registry.getBounty(i);
          assert(bounty[6] == 0);
        }



      } else {

        await registry.issueBounty(accounts[(i%5)],
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    false,
                                    0x0,{from: accounts[(i%5)]});

        await registry.activateBounty(i,1000, {from: accounts[(i%5)], value: 1000});

        await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});

        await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});

        await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
        var bounty = await registry.getBounty(i);
        assert(bounty[6] == 0);
      }
    }

    let balance1 = await bountyToken.balanceOf(registry.address);
    assert(balance1 == 0);
    let balance2 = await bountyToken2.balanceOf(registry.address);
    assert(balance2 == 0);
    let balance3 = await web3.eth.getBalance(registry.address);
    assert(balance3 == 0);
  });

  it("[ETH/TOKEN] Verifies that I can issue, activate, fulfill, accept, and pay out new bounties paying in both ETH and Tokens from various addresses, with various token contracts, with several fulfillments", async () => {

    // create Bounty registry owned by User 0
    let registry = await StandardBounties.new(accounts[0]);

    // create Token type BOUNT owned by User 0
    // one billion tokens
    let bountyToken = await HumanStandardToken.new(1000000000, "Bounty Token", 18, "BOUNT", {from: accounts[0]});

    // User 0 send 100 million BOUNT to User 1
    await bountyToken.transfer(accounts[1], 100000000, {from: accounts[0]});

    // User 0 send 100 million BOUNT to User 2
    await bountyToken.transfer(accounts[2], 100000000, {from: accounts[0]});

    // User 0 send 100 million BOUNT to User 3
    await bountyToken.transfer(accounts[3], 100000000, {from: accounts[0]});

    // User 0 send 100 million BOUNT to User 4
    await bountyToken.transfer(accounts[4], 100000000, {from: accounts[0]});

    // User 0 send 100 million BOUNT to User 5
    await bountyToken.transfer(accounts[5], 100000000, {from: accounts[0]});

    // create Token type BOUNT2 owned by User 0
    // one billion tokens
    let bountyToken2 = await HumanStandardToken.new(1000000000, "Bounty Token2", 18, "BOUNT2", {from: accounts[0]});

    // User 0 send 100 million BOUNT2 to User 1
    await bountyToken2.transfer(accounts[1], 100000000, {from: accounts[0]});

    // User 0 send 100 million BOUNT2 to User 2
    await bountyToken2.transfer(accounts[2], 100000000, {from: accounts[0]});

    // User 0 send 100 million BOUNT2 to User 3
    await bountyToken2.transfer(accounts[3], 100000000, {from: accounts[0]});

    // User 0 send 100 million BOUNT2 to User 4
    await bountyToken2.transfer(accounts[4], 100000000, {from: accounts[0]});

    // User 0 send 100 million BOUNT2 to User 5
    await bountyToken2.transfer(accounts[5], 100000000, {from: accounts[0]});

    for (var i = 0; i < 100; i++){
      if (i % 2){
        if (i % 4){
          await registry.issueBounty(accounts[(i%5)],
                                      2528821098,
                                      "data"+i,
                                      1000,
                                      0x0,
                                      true,
                                      bountyToken.address,{from: accounts[(i%5)]});
          await bountyToken.approve(registry.address, 3000, {from: accounts[(i%5)]});

          await registry.activateBounty(i,3000, {from: accounts[(i%5)]});

          await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});
          await registry.fulfillBounty(i, "data2", {from: accounts[(i%5)+2]});
          await registry.fulfillBounty(i, "data3", {from: accounts[(i%5)+3]});

          await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});
          await registry.acceptFulfillment(i,1,{from: accounts[(i%5)]});
          await registry.acceptFulfillment(i,2,{from: accounts[(i%5)]});

          await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
          await registry.fulfillmentPayment(i,1,{from: accounts[(i%5)+2]});
          await registry.fulfillmentPayment(i,2,{from: accounts[(i%5)+3]});
          var bounty = await registry.getBounty(i);
          assert(bounty[6] == 0);
        } else {
          await registry.issueBounty(accounts[(i%5)],
                                      2528821098,
                                      "data"+i,
                                      1000,
                                      0x0,
                                      true,
                                      bountyToken2.address,{from: accounts[(i%5)]});
          await bountyToken.approve(registry.address, 3000, {from: accounts[(i%5)]});

          await registry.activateBounty(i,3000, {from: accounts[(i%5)]});

          await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});
          await registry.fulfillBounty(i, "data2", {from: accounts[(i%5)+2]});
          await registry.fulfillBounty(i, "data3", {from: accounts[(i%5)+3]});

          await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});
          await registry.acceptFulfillment(i,1,{from: accounts[(i%5)]});
          await registry.acceptFulfillment(i,2,{from: accounts[(i%5)]});

          await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
          await registry.fulfillmentPayment(i,1,{from: accounts[(i%5)+2]});
          await registry.fulfillmentPayment(i,2,{from: accounts[(i%5)+3]});

          var bounty = await registry.getBounty(i);
          assert(bounty[6] == 0);
        }
      } else {

        await registry.issueBounty(accounts[(i%5)],
                                    2528821098,
                                    "data"+i,
                                    1000,
                                    0x0,
                                    false,
                                    0x0,{from: accounts[(i%5)]});

        await registry.activateBounty(i,3000, {from: accounts[(i%5)], value: 3000});

        await registry.fulfillBounty(i, "data", {from: accounts[(i%5)+1]});
        await registry.fulfillBounty(i, "data2", {from: accounts[(i%5)+2]});
        await registry.fulfillBounty(i, "data3", {from: accounts[(i%5)+3]});

        await registry.acceptFulfillment(i,0,{from: accounts[(i%5)]});
        await registry.acceptFulfillment(i,1,{from: accounts[(i%5)]});
        await registry.acceptFulfillment(i,2,{from: accounts[(i%5)]});

        await registry.fulfillmentPayment(i,0,{from: accounts[(i%5)+1]});
        await registry.fulfillmentPayment(i,1,{from: accounts[(i%5)+2]});
        await registry.fulfillmentPayment(i,2,{from: accounts[(i%5)+3]});
        var bounty = await registry.getBounty(i);
        assert(bounty[6] == 0);
      }
    }

    let balance1 = await bountyToken.balanceOf(registry.address);
    assert(balance1 == 0);
    let balance2 = await bountyToken2.balanceOf(registry.address);
    assert(balance2 == 0);
    let balance3 = await web3.eth.getBalance(registry.address);
    assert(balance3 == 0);
  });

  describe('#oracles', () => {
    let gnosis, ipfsHash

    beforeEach(async () => {
        gnosis = await Gnosis.create(options)
        ipfsHash = await gnosis.publishEventDescription(description)
    })

    it('creates centralized oracles', async () => {
        let oracle = await gnosis.createCentralizedOracle(ipfsHash)
        assert(oracle)
    })

    it('estimates gas usage for centralized oracle creation', async () => {
        let centralizedOracleFactory = await gnosis.contracts.CentralizedOracleFactory.deployed()
        let actualUsingRPC = await centralizedOracleFactory.createCentralizedOracle.estimateGas(ipfsHash)
        let actualUsingStats = centralizedOracleFactory.gasStats.createCentralizedOracle.averageGasUsed

        assert.equal(actualUsingRPC, await gnosis.createCentralizedOracle.estimateGas(ipfsHash, { using: 'rpc' }))
        assert.equal(actualUsingStats, await gnosis.createCentralizedOracle.estimateGas({ using: 'stats' }))
    })

    it('errors with sensible message when creating centralized oracle incorrectly', async () => {
        let error = await requireRejection(gnosis.createCentralizedOracle('???'))
        assert.equal(error.toString(), 'Error: expected ipfsHash ??? to have length 46')
    })

    it('creates ultimate oracles', async () => {
        let cenOracle = await gnosis.createCentralizedOracle(ipfsHash)
        let ultOracle = await gnosis.createUltimateOracle({
            forwardedOracle: cenOracle,
            collateralToken: gnosis.etherToken,
            spreadMultiplier: 2,
            challengePeriod: 3600,
            challengeAmount: 1000,
            frontRunnerPeriod: 60
        })
        assert(ultOracle)
    })

    it('estimates gas usage for ultimate oracle creation', async () => {
        let cenOracle = await gnosis.createCentralizedOracle(ipfsHash)

        let ultimateOracleFactory = await gnosis.contracts.UltimateOracleFactory.deployed()
        let ultOracleArgs = {
            forwardedOracle: cenOracle,
            collateralToken: gnosis.etherToken,
            spreadMultiplier: 2,
            challengePeriod: 3600,
            challengeAmount: 1000,
            frontRunnerPeriod: 60
        }

        let actualUsingRPC = await ultimateOracleFactory.createUltimateOracle.estimateGas(
            ultOracleArgs.forwardedOracle.address,
            ultOracleArgs.collateralToken.address,
            ultOracleArgs.spreadMultiplier,
            ultOracleArgs.challengePeriod,
            ultOracleArgs.challengeAmount,
            ultOracleArgs.frontRunnerPeriod
        )
        let actualUsingStats = ultimateOracleFactory.gasStats.createUltimateOracle.averageGasUsed

        assert.equal(actualUsingRPC, await gnosis.createUltimateOracle.estimateGas(Object.assign({ using: 'rpc' }, ultOracleArgs)))
        assert.equal(actualUsingStats, await gnosis.createUltimateOracle.estimateGas({ using: 'stats' }))
    })

    it('publishes event descriptions and loads them', async () => {
        let newDescription = {
            title: 'Will Bitcoin Hardfork before 2018',
            description: 'Hello world',
            resolutionDate: description.resolutionDate,
            outcomes: [
              'Yes',
              'No'
            ]
        }
        let newIpfsHash = await gnosis.publishEventDescription(newDescription)
        assert(newIpfsHash)
        let loadedDescription = await gnosis.loadEventDescription(newIpfsHash)
        assert.deepEqual(loadedDescription, description)
    })
  })

  describe('#events', () => {
    let gnosis, ipfsHash, oracle

    beforeEach(async () => {
        gnosis = await Gnosis.create(options)
        ipfsHash = await gnosis.publishEventDescription(description)
        oracle = await gnosis.createCentralizedOracle(ipfsHash)
    })

    it('creates and resolves categorical events', async () => {
        let event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2
        })
        assert(event)
        assert(!await oracle.isOutcomeSet())
        assert(!await event.isOutcomeSet())

        await gnosis.resolveEvent({
            event,
            outcome: 1,
        })

        assert(await oracle.isOutcomeSet())
        assert(await event.isOutcomeSet())
    })

    it('creates and resolves scalar events', async () => {
        let event = await gnosis.createScalarEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            lowerBound: -1000,
            upperBound: 1000
        })
        assert(event)
        assert(!await oracle.isOutcomeSet())
        assert(!await event.isOutcomeSet())

        await gnosis.resolveEvent({
            event,
            outcome: -55,
        })

        assert(await oracle.isOutcomeSet())
        assert(await event.isOutcomeSet())
    })

    it('estimates gas usage for categorical event creation', async () => {
        let eventFactory = await gnosis.contracts.EventFactory.deployed()
        let eventArgs = {
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2
        }

        let actualUsingRPC = await eventFactory.createCategoricalEvent.estimateGas(
            eventArgs.collateralToken.address,
            eventArgs.oracle.address,
            eventArgs.outcomeCount
        )
        let actualUsingStats = eventFactory.gasStats.createCategoricalEvent.averageGasUsed

        assert.equal(actualUsingRPC, await gnosis.createCategoricalEvent.estimateGas(Object.assign({ using: 'rpc' }, eventArgs)))
        assert.equal(actualUsingStats, await gnosis.createCategoricalEvent.estimateGas({ using: 'stats' }))
    })

    it('estimates gas usage for event resolution', async () => {
        let event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2
        })
        assert(await gnosis.resolveEvent.estimateGas({ using: 'stats' }) > 0)
    })
  })

  describe('#markets', () => {
    let gnosis, oracle, event, ipfsHash

    beforeEach(async () => {
        gnosis = await Gnosis.create(options)
        ipfsHash = await gnosis.publishEventDescription(description)
        oracle = await gnosis.createCentralizedOracle(ipfsHash)
        event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2
        })
    })

    it('creates markets', async () => {
        let market = await gnosis.createMarket({
            event: event,
            marketMaker: gnosis.lmsrMarketMaker,
            fee: 100,
        })
        assert(market)
    })
  })
});