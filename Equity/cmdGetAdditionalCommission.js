const { doCmd } = require('../lib')
async function cmdGetAdditionalCommission(context){
    //block
    //noreplace
    /**
     * @version 1
     * @environment Equity
     * @author Arnold Irias <arnold.irias@axxis-systems.com>
     * @created 2023-05-31
     * @task 117814
     * @description returns the values of Premium Issuance Accounting to be used in accounting template
     * @param {number} _policyId
     * @copyright Axxis Systems S.A. 16117 cmdGetAdditionalCommission
     */
    const { row:{ policyId }} = context;
    await doCmd({ cmd: "RepoLifePolicy", data: { operation: "GET", include: ['Cessions.Participants','Commissions', 'Accounts','Accounts.Movements'], filter: "id=" + policyId , noTracking: true } });
    if (RepoLifePolicy.outData.length === 0)
        throw `@Error policy [${policyId}] does not exist or is not in ACTIVE status`;

    const policy = RepoLifePolicy.outData.pop();
    const commissions = (policy.Commissions || []).filter( item => ['Commission_initial','Commission_renewal','Clawback_commission'].includes(item.type)).map( item => item.commission).reduce((a,b)=> a+b,0);
    GetCommissions(policy);
    GetInternalFees(policy)
    context.row.anualPremium = policy.anualPremium;
    context.row.iscurrencynational = policy.currency === 'KES' ? true : false;
    context.row.policyCode = policy.code;
    context.row.productCode = policy.productCode;
    context.row.currency = policy.currency;
    context.row.levy1 = Number(parseFloat(policy.anualPremium * 0.01).toFixed(2));
    context.row.levy50 = Number(parseFloat(context.row.levy1 * 0.5).toFixed(2));
    context.row.commissions =  commissions
    context.row.Cessions = [];

    policy.Cessions.forEach(r => {
        if (r.Participants.length > 0 && r.overwritten === false) {
            context.row.Cessions.push(...r.Participants);
        }
    });

    let arrayAcc = [];
    let val = { 'outdata': context.row }
    arrayAcc.push(val);

    return arrayAcc;

    function GetInternalFees({Accounts}){
        const principalAccount = Accounts.find(item => item.accNo.includes('INTERNALFEES'));
        const InternalTypes = [{ code: 'DUTY', name: 'Stamp Duty', amount: 0 }, { code: 'LEVY', name: 'Premium Levy', amount: 0 }, { code: 'PHCF', name: 'Policy Holder Compensation', amount: 0 }]
        return principalAccount.Movements.reduce(( total, movement)=> {
            const typeIndex = total.findIndex( item => item.transaction == movement.transaction);
            if(typeIndex >= 0){
                total[typeIndex].amount += movement.amountBalance;
                return total;
            }
            // Find Type 
            const type = InternalTypes.find( item=> movement.transaction.includes(item.code));
            type.amount = movement.amountBalance;
            total.push(type);
            return total;
        },[])
    }
    function GetCommissions({ Commissions }){
        const additionalCom = Commissions.filter( item => ['Commission_initial','Commission_renewal','Clawback_commission'].includes(item.type));
        const totalAddCommission = additionalCom.map( item => item.commission).reduce((a,b)=> a+b,0);
        context.row.additionalCom = additionalCom;
        context.row.totalAddCommission = totalAddCommission;
    }
}

module.exports = cmdGetAdditionalCommission;