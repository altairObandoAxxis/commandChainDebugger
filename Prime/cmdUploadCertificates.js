const { doCmd } = require('../lib');

async function cmdUploadCertificates(context) {
    const NEW_CONTACT = 'NOT APPLICABLE||(NAP)|',
      MAIN_MEMBER = 'MAIN MEMBER||(A)|',
      SPOUSE      = 'SPOUSE||(B)|',
      CHILD       = 'CHILD||(C)|',
      GROUPS = ['DEFAULT', 'GROUP 1', 'GROUP 2', 'GROUP 3', 'GROUP 4', 'GROUP 5'];
    // Validate parent holder
    const Contact = await GetInsuredByIdType();
    // Validate payer
    const { row: { relationshipName, group, groupPolicyId }} = context;
    const MainPayer = relationshipName == MAIN_MEMBER ? Contact : await GetContactByPassport();
    // Validate Group
    if( !GROUPS.includes(group))
        throw '@Certificate Group does not match available groups';
    // Create certificate
    await doCmd({cmd:'LoadEntity', data:{ entity:'LifePolicy', filter:`id=${ groupPolicyId }`, fields:'id,insuredSum, [plan], periodicity, currency, [start], [end], comContractId, sellerId'}});
    if(!LoadEntity.ok)
        throw '@'+LoadEntity.msg;
    const { outData:{ id, insuredSum, plan, periodicity, currency, start, end, comContractId, sellerId }} = LoadEntity;
    // Relationship
    const insuredRelationship = relationshipName == MAIN_MEMBER ? 1: 
                                relationshipName == SPOUSE ? 202 : 203;

    await doCmd({cmd:'AddCertificate', data:{
        groupPolicyId: groupPolicyId,
        certificates:[{
            group,
            insuredSum, 
            plan, 
            periodicity, 
            currency, 
            start, 
            end, 
            comContractId, 
            sellerId,
            contactId: Contact.id,
            payerId: MainPayer.id,
            Insureds:[ { contactId: Contact.id, name: Contact.FullName, relationship: insuredRelationship }]
        }]
    }});
    if (!AddCertificate.ok) 
        throw '@'+AddCertificate.msg;

    return { ok: true, msg: 'Upload Succesful', outData: {} };

    async function GetContactByPassport(){
        const { row: { parentHolderId }} = context;
        await doCmd({ cmd:'GetContacts', data:{ filter: `cnp LIKE '%${ parentHolderId }%' OR nif LIKE '%${ parentHolderId }%' OR passport LIKE '%${ parentHolderId }%' OR nationalId LIKE '%${parentHolderId}%'` }});
        if(!GetContacts.outData || GetContacts.outData.length == 0)
            throw `@Holder code not found ${ parentHolderId }`;

        return GetContacts.outData.pop();
    }
    async function GetInsuredByIdType(){
        const { row: { idTypeName }} = context;
        if(idTypeName == NEW_CONTACT)
            return await CreateNewInsured();
        return await FindContact();
    }
    async function CreateNewInsured(){
        const { row: { birth, title, name, surname1, middleName, gender, nationality }} = context;
        const formatedBirth = new Date(birth).toISOString().split('T',1).pop();
        await doCmd({ cmd: 'GetContacts', data:{ filter: `[name] LIKE '%${name}%' AND surname1 LIKE '%${surname1}%' AND birth = '${ formatedBirth }'`}});
        if(GetContacts.outData && GetContacts.outData.length > 0)
            return GetContacts.outData.pop();
        // Create a new
        await doCmd({ cmd: 'GetCode', data: { counter: 'CID', decrement: false, pad: 13 } });
        const customID = 'CID' + GetCode.outData,
                idType = 'ID06';

        await doCmd({ cmd:'AddOrUpdateContact', data:{ isPerson: true, active: true, title, name, middleName, surname1, birth: formatedBirth, gender: gender.toUpperCase()=='MALE'?'M':'F', nationality: nationality || 183, passport: customID, idType  }});
        if (AddOrUpdateContact.ok != true) 
            throw '@'+AddOrUpdateContact.msg;
        const { outData: contact } = AddOrUpdateContact 
        // Get Current User
        await doCmd({ cmd:'GetCurrentUser',data:{}});
        const { outData: { email: userEmail }} = GetCurrentUser;
        // Add Comment
        await doCmd({ cmd:'RepoComment', data:{ operation:'ADD', entity:{ message: 'This contact has not provided identification card. A provisional ID was created.', contactId: contact.id, created: new Date(), user: userEmail } }});
        return contact;
    }
    async function CreateNewPayer(){
        const { row:{ idTypeName, title, name, middleName, surname1, birth, gender, nationality, passport }} = context;
        const idType = idTypeName == 'PASSPORT ID' ? 'ID04' : 'ID02',
            customGender = gender.toUpperCase() == 'MALE'? 'M': 'F',
            customNationality = nationality || 183;
        const entity = { 
                isPerson: true, 
                active: true, 
                title, 
                name, 
                middleName, 
                birth, 
                surname1, 
                gender: customGender, 
                nationality: customNationality, 
                idType
            }
        if(idTypeName == 'PASSPORT ID')
            entity['passport'] = passport;
        else
            entity['nationalId']= passport;

        // Create Payer
        await doCmd({ cmd: 'AddOrUpdateContact', data: entity });
        
        if (!AddOrUpdateContact.ok) 
            throw '@'+AddOrUpdateContact.msg;
        return AddOrUpdateContact.outData;
    }
    async function FindContact(){
        const { row: { passport, name, middleName, surname1, birth }} = context;
        const formatedBirth = new Date(birth).toISOString().split('T',1).pop();
        let filter = ` ((cnp LIKE '%${ passport }%' OR nif LIKE '%${ passport }%' OR passport LIKE '%${ passport }%' OR nationalId LIKE '%${passport}%') OR`;
            filter +=` ([name] LIKE '%${ name }%' AND middleName LIKE '%${ middleName }%' AND surname1 LIKE '%${ surname1 }%')) AND`;
            filter +=` birth = '${ formatedBirth }'`;
        await doCmd({cmd:'GetContacts', data:{ filter }});
        if(GetContacts.outData && GetContacts.outData.length > 0)
            return GetContacts.outData.pop();
        return await CreateNewPayer();
    }
}

module.exports = { cmdUploadCertificates }