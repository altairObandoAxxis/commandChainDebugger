const { doCmd } = require('../lib')
const Borderau=async (context)=>{
    //block
    //noreplace
    /**
     * @author Noel Obando
     * @summary This command allows the border of claims simulating a pivot by reinsurer
     * @created 2023-11-07
     * @taskId 154520
     * @name cmdGetClaimBordereu
     */
    //#region Paremeters
    const { liquidationId } = context;
    //#endregion
    if(typeof liquidationId =='undefined' || liquidationId == null || liquidationId =='')
    return { dataset: [], columns: [] };
    const sql =`SELECT
    loss.id,
    ISNULL(pol.code,'') policyNumber,
    TRIM(CONCAT(ISNULL(hol.name,''),' ',ISNULL(hol.middlename,''),' ',ISNULL(hol.surname1,''),' ',ISNULL(hol.surname2,''))) schemeName,
    ISNULL(pol.start,'') schemeInceptionDate,
    ISNULL((SELECT TOP 1 anniversary FROM Anniversary WHERE lifePolicyId = pol.id ORDER BY id desc), '') schemeRenewalDate,
    ISNULL(pol.commercial,'') businessClass,
    TRIM(CONCAT(ISNULL(ins.name,''),' ',ISNULL(ins.middlename,''),' ',ISNULL(ins.surname1,''),' ',ISNULL(ins.surname2,''))) lifeAssuredName,
    TRIM(CONCAT(ISNULL(claimer.name,''),' ',ISNULL(claimer.middlename,''),' ',ISNULL(claimer.surname1,''),' ',ISNULL(claimer.surname2,''))) claimantName,
    ISNULL(rel.name, 'N/A') relationshipPrincipalMember,
    ISNULL(ins.gender,'') gender,
    ISNULL(ins.birth,'') DOB,
    CASE WHEN ins.birth IS NULL THEN '-'
        ELSE DATEDIFF(YEAR, ins.birth, pol.start)
    END age,
    ISNULL(ins.nationalId, '') nationalId, 
    '' employeeAccount,
    REPLACE(ISNULL(occ.name,''),',',' ') occupation,
    ISNULL(pol.activeDate,'') effectiveDate,
    ISNULL(pol.inactiveDate,'') expiryDate,
    pol.start coverStart,
    pol.[end] coverEnd,
    cla.code claimNumber,
    cla.occurrence claimEvent,
    cla.notification,
    '' reinsurerNotify,
    cla.claimType,
    ISNULL(erc.name, '') causeOfClaim,
    (SELECT TOP 1 fecha FROM ProcesoPaso WHERE procesoId = cla.processId AND entityState LIKE 'ADJUDICATION') claimDecision,
    (SELECT TOP 1 fecha FROM ProcesoPaso WHERE procesoId = cla.processId AND estado LIKE '32 Pay Out Claim') claimPayment,
    '' lastPosibleClaimPayment,
    CASE WHEN ins.birth IS NULL THEN '-'
        ELSE DATEDIFF(YEAR, ins.birth, cla.occurrence)
    END ageAtTimeLoss,
    '' statusClaim,
    CASE WHEN YEAR(pol.activeDate) = YEAR(cla.occurrence) THEN YEAR(cla.occurrence)
        ELSE YEAR(ISNULL((SELECT TOP 1 anniversary FROM Anniversary WHERE lifePolicyId = pol.id AND YEAR(cla.occurrence) = YEAR(anniversary) ), cla.occurrence )) END
    AS underwrittingYear,
    '' uwDecision,
    LifeCoverage.limit sumAssured,
    ABS(loss.cededReserve) reinsurerSum,
    CASE WHEN LifeCoverage.limit > 0 THEN ABS(loss.cededReserve)/LifeCoverage.limit
    ELSE 0 END proportionReinsurer,
    loss.loss claimAmount,
    loss.cededLoss reinsuranceRecoveries,
    cesPart.name participant,
    cesPart.loss reinsuranceShare
    FROM LossCession loss
    INNER JOIN LossCessionPart cesPart  ON loss.id = cesPart.lossCessionId
    INNER JOIN Cession cess             ON cess.id = loss.cessionId
    INNER JOIN LifeCoveragePayout cov   ON cov.id  = loss.lifeCoveragePayoutId
    INNER JOIN lifeCoverage             ON cov.lifeCoverageId = LifeCoverage.id
    INNER JOIN LifePolicy pol           ON pol.id  = cov.lifePolicyId
    INNER JOIN Contact    hol           ON hol.id  = pol.holderId
    INNER JOIN Claim      cla           ON cla.id  = cov.claimId
    INNER JOIN Insured    inx           ON pol.id  = inx.lifePolicyId
    INNER JOIN Contact    ins           ON ins.id  = inx.contactId
    INNER JOIN Contact  claimer ON claimer.id      = cla.claimerId
    LEFT JOIN RelationshipCatalog rel   ON rel.id  = inx.relationship
    LEFT JOIN Occupation occ            ON occ.id  = ins.occupationId
    LEFT JOIN EventReasonCatalog erc    ON erc.code = cla.eventReason
    WHERE cesPart.liquidationId IN (
        select l2.id
            from Liquidation as l1
            left join Liquidation as l2 on l1.operationId = l2.operationId
            where l1.id = ${liquidationId}
        ) OR cesPart.liquidationId = ${liquidationId}`
    await doCmd({cmd:'DoQuery', data: { sql }});
    // Create a pivot using js
    // Group by loss 
    let dataSet = DoQuery.outData.reduce((acc, row)=>{
    acc[row.id] = acc[row.id] || [];
    acc[row.id].push(row);
    return acc;
    },{});
    // Find the maximum column number as reinsurer participants
    let participants = [];
    Object.keys(dataSet).forEach( key => {
        dataSet[key].forEach( item => {
            if(!participants.includes(item.participant))
                participants.push(item.participant)
        })
    });

    const finalDataSet = Object.keys(dataSet).map( key => {
    const [ uniqueRow ] = dataSet[key];
    // Add Reinsurers values
    participants.forEach( name => {
        const cession = dataSet[key].find( item => item.participant == name);
        uniqueRow[name] = cession && cession != null ? Number(cession.reinsuranceShare || 0).toLocaleString() : 0;
    })
    delete uniqueRow.reinsuranceShare
    delete uniqueRow.participant
    // Format proportionReinsurer
        uniqueRow.proportionReinsurer = Number(uniqueRow.proportionReinsurer || 0 ).toLocaleString('en-us', { maximumFractionDigits: 2 }) + ' %'
    return uniqueRow
    });
    if(!finalDataSet || finalDataSet.length == 0)
        return { dataset: [], columns: [] };
    const [ firstRow ] = finalDataSet;
    return {
        dataSet: finalDataSet,
        columns: Object.keys(firstRow)
    }
}

module.exports = Borderau;