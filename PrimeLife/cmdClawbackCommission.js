const { doCmd } = require('../lib');

const cmdClawbackCommission = async (context) => {
    const { policyId } = context;
    await doCmd({ cmd: 'RepoCommission', data: { operation: 'GET', filter: `lifePolicyId=${policyId}` } });
    const { outData: { records } } = RepoCommission;
    // Filter by liquidation
    const payed = records.filter(item => typeof item.comLiquidationId !== 'undefined' && item.comLiquidationId != null)
        .reduce((payed, item) => { payed += item.commission; return payed }, 0);
    if (payed <= 0)
        return 0;
    // Get differed value 
    await doCmd({ cmd: 'RepoLifePolicy', data: { operation: 'GET', filter: `id=${policyId}`, include: ['InsuredObjects'] } });
    const [policy] = RepoLifePolicy.outData;
    const object = policy.InsuredObjects.find(item => item.objectDefinitionId == 3);
    if (typeof object === 'undefined' || object == null)
        throw `@No insured object stored on policy ${id}`;

    const { userData: { 'Contribution-Years': differed } } = object;
    const differedPeriod = Math.min(10, differed);
    const { start, end, inactiveDate } = policy;
    const startDate = new Date(start),
          endDate   = new Date(inactiveDate || end);
    let diff = (endDate.getFullYear() - startDate.getFullYear());
    const remainingPeriod = differedPeriod - diff;
    return payed * remainingPeriod / differedPeriod        
}

module.exports = cmdClawbackCommission;