const { doCmd } = require('../lib')

const cmdQuoteEducationMix = async (context) => {
    //Get Info from Contacts,Policy,Product
    await doCmd({ "cmd": "RepoLifePolicy", "data": { "operation": "GET", "filter": "id=" + context.row.policyId, "include": ["Holder", "Product", "Insureds", "Insureds.Contact", "InsuredObjects"], "noTracking": true } })
    const policy = RepoLifePolicy.outData[0];
    const insuredObject = policy.InsuredObjects.filter(x => x.objectDefinitionId == 3)[0];
    const product = JSON.parse(policy.Product.configJson);

    //Basic information to calculate Rwanda Actuarial Tables
    var gender = policy.gender;
    var valuesArray = [];
    var table = gender == 'M' ? 'EducationMaleQxValues' : 'EducationFemaleQxValues';
    var technicalRate = product.ProductCharacteristic.technicalRate;
    var v = 1 / (1 + technicalRate);

    await doCmd({ "cmd": "GetFullTable", "data": { "table": table, "filter": "1=1" } });

    var qxValues = GetFullTable.outData.map(i => {
        return parseFloat(i[1]);
    })
    qxValues.splice(0, 1);

    qxValues.forEach(element => {
        valuesArray.push({
            qx: element,
            rate: v
        })
    });

    await doCmd({ "cmd": "DoCalcSheet", "data": { "name": "EduMixActuarial", "simulation": true, "jSimulation": JSON.stringify(valuesArray) } });
    var actuarialValues = [];

    DoCalcSheet.outData.map(i => {
        actuarialValues.push({
            x: i[0],
            qx: i[1],
            lx: i[2],
            dx: i[3],
            Dx2: i[4],
            Nx: i[5],
            Sx: i[6],
            Cx: i[7],
            Mx: i[8],
            Rx: i[9]
        });
    });

    //Information for the quoting process
    var quotingValues = [];
    var birthYear = new Date(policy.Insureds[0].Contact.birth).getFullYear();
    var startYear = new Date(policy.start).getFullYear();
    var ageAtInception = Math.max(20, startYear - birthYear);
    var duration = Math.min(policy.duration, 30);
    var annuityDuration = Math.min(insuredObject.userData.nmbAnnuity, 6);
    var premiumType = policy.paymentDuration == -1 ? 'Single' : 'Annual';
    var fraction = insuredObject.userData.nmbFraction;
    var insuredSum = policy.insuredSum;
    var acquisitionCost = product.ProductCharacteristic.acquisitionCost;
    var g1 = product.ProductCharacteristic.g1;
    var g2 = product.ProductCharacteristic.g2;

    for (let index = 0; index <= duration; index++) {
        quotingValues.push({
            Age: ageAtInception,
            ageAtEntry: ageAtInception,
            lx: actuarialValues.filter(item => item.x == ageAtInception)[0].lx,
            lxk: actuarialValues.filter(item => item.x == (ageAtInception + index))[0].lx,
            lxk1: actuarialValues.filter(item => item.x == (ageAtInception + index + 1))[0].lx,
            NxK: actuarialValues.filter(item => item.x == (ageAtInception + index))[0].Nx,
            DxK: actuarialValues.filter(item => item.x == (ageAtInception + index))[0].Dx2,
            Nx: actuarialValues.filter(item => item.x == ageAtInception)[0].Nx,
            Nxn: actuarialValues.filter(item => item.x == (ageAtInception + duration))[0].Nx,
            Dx: actuarialValues.filter(item => item.x == ageAtInception)[0].Dx2,
            Nx1: actuarialValues.filter(item => item.x == ageAtInception + 1)[0].Nx,
            rate: technicalRate,
            annuityDuration: annuityDuration,
            fraction: parseFloat(fraction) / 100,
            g1: g1,
            g2: g2,
            acquisition: acquisitionCost,
            duration: duration
        })
    }

    await doCmd({ "cmd": "DoCalcSheet", "data": { "name": "EducationMixed", "simulation": true, "jSimulation": JSON.stringify(quotingValues) } });

    var finalResult = DoCalcSheet.outData[1];

    var finalValues = {
        PUPDeath: finalResult[15],
        PAPDeath: finalResult[16],
        PUIDeath: finalResult[17],
        PAIDeath: finalResult[18],
        PUCDeath: finalResult[19],
        PACDeath: finalResult[20],
        PUPAnnuity: finalResult[21],
        PAPAnnuity: finalResult[22],
        PUIAnnuity: finalResult[23],
        PAIAnnuity: finalResult[24],
        PUCAnnuity: finalResult[25],
        PACAnnuity: finalResult[26]
    };

    var purePremium = 0;
    var managementFees = 0;
    var acquisitionFees = 0;

    if (premiumType == 'Single') {
        purePremium = finalValues.PUPDeath + finalValues.PUPAnnuity;
        managementFees = finalValues.PUPDeath - finalValues.PUPDeath + finalValues.PUPAnnuity - finalValues.PUPAnnuity;
        acquisitionFees = finalValues.PUCDeath - finalValues.PUPDeath + finalValues.PUCAnnuity - finalValues.PUPAnnuity;
    }
    else {
        purePremium = finalValues.PAPDeath + finalValues.PAPAnnuity;
        managementFees = finalValues.PAIDeath - finalValues.PAPDeath + finalValues.PAIAnnuity - finalValues.PAPAnnuity;
        acquisitionFees = finalValues.PACDeath - finalValues.PAIDeath + finalValues.PACAnnuity - finalValues.PAIAnnuity;
    }

    if (context.row.reserve) {
        var reserveYear = new Date(context.row.reserveDate).getFullYear();
        var reserveYears = reserveYear - startYear;
        var reserveAge = reserveYears + ageAtInception;
        var SinglePmk = DoCalcSheet.outData.filter(x => x[2] == reserveAge)[0][32];
        return Math.round(100 * insuredSum * SinglePmk) / 100;
    }

    return Math.round((purePremium + managementFees + acquisitionFees) * insuredSum * 100) / 100;
}

module.exports = cmdQuoteEducationMix;