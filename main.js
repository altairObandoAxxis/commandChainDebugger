const { doCmd } = require('./lib')
const main = async (context) => {
    var vCodLiquiGenerado;
    var strcheckdat = {};
    var arrcheckdat = [];
    var arrdata = [];

    var contactId;
    let datos = {
        'codEnvio': 'codEnvio',
        'numLiqui': 'numLiqui',
        'folioSermecoop': 'folioSrmcp',
        'folioProducto': 'folioProducto',
        'estadoProducto': 'edoProducto',
        'idEmpresa': 'idEmpresa',
        'empresa': 'empresa',
        'idPlan': 'idPlan',
        'nombrePlan': 'nombrePlan',
        'sistemaSaludAfiliado': 'sistSaludAfi',
        'rutAfiliado': 'rutAfi',
        'nombreAfiliado': 'nombreAfi',
        'apPaternoAfiliado': 'paternoAfi',
        'apMaternoAfiliado': 'maternoAfli',
        'feNacimientoAfi': 'feNacimientoAfi',
        'sexAfi': 'sexAfi',
        'estadoVigenciaAfiliado': 'edoVigenciaAfi',
        'nBeneficiario': 'beneficiario',
        'rutBeneficiario': 'rutBen',
        'nombreBeneficiario': 'nombreBen',
        'apPaternoBeneficiario': 'paternoBen',
        'apMaternoBeneficiario': 'maternoBen',
        'sistemaSaludBeneficiario': 'sistSaludBen',
        'feNacimientoBen': 'feNacimientoBen',
        'sexBen': 'sexBen',
        'estadoVigenciaBeneficiario': 'edoVigenciaBen',
        'fechaRecepcion': 'feRecepcion',
        'fechaPago': 'fePago',
        'fechaProceso': 'feProceso',
        'formaPago': 'formaPago',
        'destinoPago': 'destPago',
        'tipoCredito': 'tCredito',
        'tipoRespaldoCredito': 'tRespaldoCredito',
        'tipoProductoCredito': 'tProdCredito',
        'motivoDevolucion': 'motDevolucion',
        'origenLiquidacion': 'origenLiquidacion',
        'observacion': 'obs',
        'uf': 'uf',
        'ejecutivo': 'ejecutivo',
        'cantDocs': 'cantDocs',
        'listaDocs': 'listaDocs',
        'rutPrestador': 'rutPrest',
        'nombrePrestador': 'nombrePrestador',
        'folioFGR': 'folioFGR',
        'numeroDocumento': 'numDoc',
        'cantPrest': 'cantPrest',
        'listaPrest': 'listaPrest',
        'idPrestacionCTA': 'idPrest',
        'nombrePrestacionCTA': 'nombrePrestacion',
        'fechaDocumento': 'feDoc',
        'valorTotal': 'valTotal',
        'bonificacionSistemaSalud': 'bonoSistSalud',
        'copago': 'copago',
        'montoAfecto': 'montoAfecto',
        'bonificacionSermecoop': 'beneficioSrmcp',
        'porcentajeBonificacion': 'porcentajeBonif',
        'costoSocio': 'costoSocio',
        'montoDeducible': 'montoDeducible'
    }
    let estadoAprobacion = {
        '1': 'a', //approved | aceptada
        '2': 'l', //limit approved | aceptada parcial
        '3': 'd', //declined | pendiente
        '4': 'c'  //canceled | rechazada
    }

    // 0, '20230303' 
    const formatDate = (date) => {
        if (typeof date === 'string' && !date.includes('-'))
            return getFormatedDateString(date);
        try {
            return new Date(date).toISOString().split('T', 1).pop();
        } catch (error) {
            return new Date().toISOString().split('T', 1).pop();
        }
    }
    const agregarRutValidador = (rut) => {
        let ruts = rut + '';
        var M = 0, S = 1;
        for (; ruts; ruts = Math.floor(ruts / 10)) {
            S = (S + ruts % 10 * (9 - M++ % 6)) % 11;
        }
        S = (S ? S - 1 : 'K');
        return rut + '-' + S;
    }

    async function valLiquidacion() {
        var strcheckdat = {};
        var vValidaciones = [];
        var vInvalid = false;

        let rutBeneficiario = agregarRutValidador(context.row['rutBen']);
        let vFilter = `isPerson = 'true' and cnp = '${rutBeneficiario.trim()}'`;
        await doCmd({ cmd: 'GetContacts', data: { filter: vFilter } });
        if (GetContacts.outData.length == 0) {
            strcheckdat['rutBeneficiario'] = '<no existente>> ' + rutBeneficiario;
            vInvalid = true;
        } else {
            contactId = GetContacts.outData[0].id;
        };

        let rutTitular = context.row['rutAfi'];
        let idPoliza = context.row['idEmpresa'];
        idPoliza = idPoliza.substring(0, idPoliza.indexOf('-'));
        let certificado = await GetPolizaByIdByRutTitular(idPoliza, rutTitular);

        if (certificado === null) {
            strcheckdat['rutTitular'] = '<Titular no existe>>' + rutTitular + '-' + idPoliza;
            vInvalid = true;
        } else {
            if (!certificado) {
                strcheckdat['idPoliza'] = '<Poliza no existe>>' + idPoliza;
                vInvalid = true;
            };

        };

        if (vInvalid == true) {
            vValidaciones.push(strcheckdat);
        };

        return vValidaciones;
    }

    async function valDocumentos(pListDocs = []) {
        var strcheckdat = {};
        var vValidaciones = [];
        var vInvalid = false;

        let idPoliza = context.row['idEmpresa'];
        /****/
        idPoliza = idPoliza.substring(0, idPoliza.indexOf('-'));
        /****/
        for (const element of pListDocs)
            for (const element2 of element.listaPrest) {
                vInvalid = false;
                strcheckdat = {};

                let idprestacionCta = element2.idPrest;

                /**Se incorpora validación de prestación asociada a cobertura a solicitud de BA
                 * 06/01/2023
                 */
                await doCmd({
                    cmd: 'LoadEntities', data: {
                        entity: 'LifeCoverage as covs inner join Benefit as benefit on (covs.id=benefit.lifeCoverageId)',
                        fields: 'benefit.code',
                        filter: `covs.lifePolicyId=${idPoliza} and benefit.code='${idprestacionCta}'`
                    }
                });
                if (LoadEntities.outData.length == 0) {
                    strcheckdat['Cobertura'] = '<Problema con La cobertura, no se encontró el codigo de la cobertura para el idPrestacionCta:>>' + idprestacionCta;
                    vInvalid = true;
                };
                /************************ */

                if (vInvalid === true) {
                    strcheckdat['idprestacionCta'] = idprestacionCta;
                    vValidaciones.push(strcheckdat);
                };
            }
        return vValidaciones;
    };

    function valPrestaciones(pListPrest = [], tabla) {
        var strcheckdat = {};
        var vValidaciones = [];
        var vInvalid = false;

        pListPrest.forEach(element => {
            vInvalid = false;
            strcheckdat = {};

            const validateDate = (date) => isNaN(Date.parse(date));
            const validateNumber = (number) => isNaN(number);

            //element.feDoc
            let fecha = formatDate(element.feDoc);
            var vFechaInvalida = validateDate(fecha);

            if (vFechaInvalida) {
                strcheckdat['feDoc'] = 'El parámetro [feDoc] es inválido.';
                vInvalid = true;
            };

            //element.valTotal
            var vNumeroInvalido = validateNumber(element.valTotal);
            if (vNumeroInvalido) {
                strcheckdat['valTotal'] = 'El parámetro [valTotal] es inválido.';
                vInvalid = true;
            };

            //element.idPrest
            let idprestacionCta = element.idPrest;
            let tipoSiniestro = tabla.filter(item => item.idPres == idprestacionCta);
            if (tipoSiniestro.length == 0) {
                strcheckdat['idPrest'] = ' Id Prestacion CTA no se encuentra  en la tabla de homologación del  Sistema>' + idprestacionCta;
                vInvalid = true;
            };

            if (vInvalid === true) {
                strcheckdat['idprestacionCta'] = idprestacionCta;
                vValidaciones.push(strcheckdat);
            };

        });

        return vValidaciones;
    };

    /*Obtiene el tipo de credito: Abono o Cargo*/
    const ObtenerTipoCredito = () => [14, 20, 19].includes(Number(context.row.tProdCredito)) ? 'cargo' : 'abono';

    function getFormatedDateString(stringFecha) {
        return stringFecha.substring(0, 4) + '-' + stringFecha.substring(4, 6) + '-' + stringFecha.substring(6, 8);
    }

    //FUNCION PARA LAS COBERTURA ELEGIBLES
    async function covelegibles(razonEvento, eventoAsegurado) {
        // var cadcov = [];
        await doCmd({ cmd: 'GetFullTable', data: { table: 'SysInsuredEventsPerCoverage' } });
        const cov = GetFullTable.outData || [] // JSON.parse(GetFullTable.outData || []);

        return cov.filter(config => config[3] == razonEvento && config[4].split(',').indexOf(eventoAsegurado) > -1)
            .map(config => config[1])
            .join();

        // if (cov.length > 0) {
        //     for (var i = 1; i < cov.length; i++) {
        //         if (cov[i][3] == razonEvento) {
        //             if ((cov[i][4]).split(',').indexOf(eventoAsegurado) > -1) {
        //                 cadcov.push(cov[i][1]);
        //             }
        //         }
        //     }
        // }
        // return cadcov.join(', ');
    }

    function responseerror(strcheckdat) {
        var arrcheckdat = [];
        strcheckdat['codigoError'] = '-1';
        strcheckdat['descripcionError'] = 'error';
        arrcheckdat.push(strcheckdat);
        JstatusData = JSON.parse(JSON.stringify(arrcheckdat));
        return JstatusData;
    }

    function responseerror2(strcheckdat, pCodLiqui, pMensaje) {

        strcheckdat['CodLiqui'] = pCodLiqui;
        strcheckdat['mensaje'] = pMensaje;
        JstatusData = JSON.parse(JSON.stringify(strcheckdat));
        return JstatusData;
    }

    async function actualizarCamposReclamo({ claim, siniestroId, tipoSiniestro, razonEvento, eventoAsegurado, idPrestacion, tabla, pfeDoc, pValTotal, pPolicyId, indexDoc, indexPrest }) {

        let estadoProd = context.row['edoProducto'] || '';
        let motDevolucion = context.row['motDevolucion'] || '';
        const updateQuery = `UPDATE 
            Claim SET 
                approvalResponse='${estadoAprobacion[estadoProd]}',
                approvalComments='${motDevolucion}',
                claimType='${tipoSiniestro}',
                eventReason='${razonEvento}',
                insuredEvent='${eventoAsegurado}'
            WHERE id = ${siniestroId}`;
        await doCmd({ cmd: 'DoQuery', data: { sql: updateQuery } });
        if (!DoQuery.ok)
            throw `@${DoQuery.msg}`;
        // await doCmd({ cmd: 'SetField', data: { 'entity': 'Claim', 'entityId': siniestroId, 'fieldValue': 'approvalResponse='' + estadoAprobacion[estadoProd] + ''' } });
        // if (!SetField.ok) {
        //     strcheckdat['Siniestro'] = '<Problema al actualizar siniestro, estado Aprobacion>>' + SetField.msg;
        //     return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
        // }
        // await doCmd({ cmd: 'SetField', data: { 'entity': 'Claim', 'entityId': siniestroId, 'fieldValue': 'approvalComments='' + motDevolucion + ''' } });
        // if (!SetField.ok) {
        //     strcheckdat['Siniestro'] = '<Problema al actualizar siniestro, motivo devolucion>>' + SetField.msg;
        //     return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
        // }
        // await doCmd({ cmd: 'SetField', data: { 'entity': 'Claim', 'entityId': siniestroId, 'fieldValue': 'claimType='' + tipoSiniestro + ''' } });
        // if (!SetField.ok) {
        //     strcheckdat['Siniestro'] = '<Problema al actualizar siniestro, tipo de Siniestro>>' + SetField.msg;
        //     return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
        // }
        // await doCmd({ cmd: 'SetField', data: { 'entity': 'Claim', 'entityId': siniestroId, 'fieldValue': 'eventReason='' + razonEvento + ''' } });
        // if (!SetField.ok) {
        //     strcheckdat['Siniestro'] = '<Problema al actualizar siniestro, Razon de evento>>' + SetField.msg;
        //     return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
        // }
        // await doCmd({ cmd: 'SetField', data: { 'entity': 'Claim', 'entityId': siniestroId, 'fieldValue': 'insuredEvent='' + eventoAsegurado + ''' } });
        // if (!SetField.ok) {
        //     strcheckdat['Siniestro'] = `<Problema al actualizar siniestro, Evento Asegurado [${eventoAsegurado}]>>${SetField.msg}`;
        //     return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
        // }

        /**Finalizamos proceso del Siniestro */
        let vResultado = await finalizarProcesoSiniestro(claim.processId);
        if (vResultado.esError) {
            strcheckdat['ProcesoSiniestro'] = `<Problema al finalizar proceso, Proceso [${claim.processId}]>>${vResultado.msg}`;
            return { Ok: false, msg: 'Error en proceso', StatusData: responseerror(strcheckdat) };
        }
        return await guardarForm(claim, tipoSiniestro, razonEvento, eventoAsegurado, idPrestacion, tabla, pfeDoc, pValTotal, pPolicyId, indexDoc, indexPrest);
    }

    async function finalizarProcesoSiniestro(procesoId) {
        await doCmd({ cmd: 'LoadEntity', data: { entity: 'proceso', fields: 'entityState', filter: `id=${procesoId}` } });
        let vEntityState = LoadEntity.outData.entityState;

        if (vEntityState !== 'CLOSED') {
            await doCmd({
                cmd: 'GotoStep', data: {
                    procesoId: procesoId,
                    estado: 'CLOSED',
                    userValues: '{}',
                    isNonInterruptingEvent: false,
                    process: null
                }
            });
            if (GotoStep.ok) {
                let esError = { 'esError': false };
                return esError;
            } else {
                let esError = { 'esError': true, 'msg': `Error al finalizar el proceso ${procesoId}:${GotoStep.msg}` };
                return esError;
            };
        } else {
            let esError = { 'esError': false };
            return esError;
        };
    }
    async function adelantarProceso(procesoId) {
        await doCmd({ cmd: 'GotoStep', data: { 'procesoId': procesoId, 'estado': '_next', 'userValues': '{}', 'isNonInterruptingEvent': false, 'process': null } });
        if (GotoStep.ok) {
            let esError = {
                'esError': false
            };
            return esError

        } else {
            let esError = {
                'esError': true,
                'msg': `Error al avanzan el el proceso ${procesoId}:${GotoStep.msg}`
            };
            return esError
        }
    }

    function isNum(val) {
        return !isNaN(val)
    }

    async function GetPolizaByIdByRutTitular(idPoliza, rutTitular) {
        let sqlQuery = '';
        if (!isNum(idPoliza)) {
            sqlQuery = `
          SELECT 
			  pol.id PolizaId,
              aseg.id IdTitular,
              CASE WHEN aseg.isPerson = '1' THEN
                  ISNULL(aseg.[name], '') + ' ' + ISNULL(aseg.middleName, '') + ' ' + ISNULL(aseg.surname1, '') + ' ' + ISNULL(aseg.surname2, '')
              ELSE
                  ISNULL(aseg.surname2, '')
              END NombreTitular,
              hol.id IdContratante, 
              CASE WHEN hol.isPerson = '1' THEN
                  ISNULL(hol.[name], '') + ' ' + ISNULL(hol.middleName, '') + ' ' + ISNULL(hol.surname1, '') + ' ' + ISNULL(hol.surname2, '')
              ELSE
                  ISNULL(hol.surname2, '')
              END NombreContratante	
          FROM LifePolicy pol 
          INNER JOIN Insured ins ON ins.lifePolicyId = pol.id 
          INNER JOIN Contact aseg on aseg.id = ins.contactId
          INNER JOIN Contact hol on hol.id = pol.holderId
          WHERE pol.groupPolicyId IN (
              SELECT id 
              FROM LifePolicy 
              WHERE extPolicy='${idPoliza}' AND policyType = 'G' AND active = 'true' 
          ) AND ((aseg.isPerson = '1' AND aseg.cnp LIKE '%${rutTitular}%') OR (aseg.isPerson = '0' AND aseg.nif LIKE '%${rutTitular}%')) 
          `;
        } else {
            sqlQuery = `
        SELECT 
			pol.id PolizaId,
            aseg.id IdTitular,
            CASE WHEN aseg.isPerson = '1' THEN
                ISNULL(aseg.[name], '') + ' ' + ISNULL(aseg.middleName, '') + ' ' + ISNULL(aseg.surname1, '') + ' ' + ISNULL(aseg.surname2, '')
            ELSE
                ISNULL(aseg.surname2, '')
            END NombreTitular,
            hol.id IdContratante, 
            CASE WHEN hol.isPerson = '1' THEN
                ISNULL(hol.[name], '') + ' ' + ISNULL(hol.middleName, '') + ' ' + ISNULL(hol.surname1, '') + ' ' + ISNULL(hol.surname2, '')
            ELSE
                ISNULL(hol.surname2, '')
            END NombreContratante	
        FROM LifePolicy pol 
        INNER JOIN Insured ins ON ins.lifePolicyId = pol.id 
        INNER JOIN Contact aseg on aseg.id = ins.contactId
        INNER JOIN Contact hol on hol.id = pol.holderId
        WHERE pol.groupPolicyId = ${idPoliza} AND policyType = 'C' AND active = 'true' AND 
			((aseg.isPerson = '1' AND aseg.cnp LIKE '%${rutTitular}%') OR (aseg.isPerson = '0' AND aseg.nif LIKE '%${rutTitular}%')) 
        `;
        }
        await doCmd({ cmd: 'DoQuery', data: { sql: sqlQuery } });
        return DoQuery.outData ? DoQuery.outData[0] : null;
        //return DoQuery.outData && DoQuery.outData.length > 0 ? DoQuery.outData[0] : null;
    }
    async function insertarReclamo({ tipoSiniestro, razonEvento, eventoAsegurado, idPrestacion, tabla, pValTotal, pfeDoc, indexDoc, indexPrest }) {
        let fechaDenuncia = new Date(getFormatedDateString(context.row['feRecepcion'])).toISOString('en-US').substring(0, 10);
        let ocurrence = new Date(getFormatedDateString(context.row['feRecepcion'])).toISOString('en-US').substring(0, 10);
        let idPoliza = context.row['idEmpresa'];
        /****/
        idPoliza = idPoliza.substring(0, idPoliza.indexOf('-'));
        /****/
        let rutBeneficiario = agregarRutValidador(context.row['rutBen']);
        let rutTitular = context.row['rutAfi'];
        let siniestroId = '';
        let codigoClaim = '';
        if (context.row['tProdCredito'] == 20) {
            codigoClaim = 'IME' + context.row['folioSrmcp'];
        }
        else if (context.row['tProdCredito'] == 11) {
            codigoClaim = 'FCV' + context.row['folioSrmcp'];
        }
        else if (context.row['tProdCredito'] == 12) {
            codigoClaim = 'FSB' + context.row['folioSrmcp'];
        }
        else if (context.row['tProdCredito'] == 13) {
            codigoClaim = 'FAH' + context.row['folioSrmcp'];
        }
        else {
            codigoClaim = context.row['folioSrmcp'];
        }
        context.row.filter = `isPerson = 'true' and cnp = '${rutBeneficiario.trim()}'`;
        await doCmd({ cmd: 'GetContacts', data: { 'filter': context.row.filter } });
        if (!GetContacts.outData.length > 0) {
            strcheckdat['rutBeneficiario'] = '<no existente>>' + rutBeneficiario;
            return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
        } else {
            contactId = GetContacts.outData[0].id;
        }
        let certificado = await GetPolizaByIdByRutTitular(idPoliza, rutTitular);
        if (!certificado) {
            strcheckdat['idPoliza'] = '<Poliza no existe>>' + idPoliza;
            return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
        }
        let contactIdTitular = certificado.IdTitular;
        holderId = certificado.IdContratante;
        let companyName = certificado.NombreContratante,
            elegibleCoverages = await covelegibles(razonEvento, eventoAsegurado);

        await doCmd({
            cmd: 'RepoClaim', data: {
                'operation': 'ADD', 'entity': {
                    'lifePolicyId': certificado.PolizaId,
                    'claimerId': contactId, 'contactId': contactIdTitular, 'eventReason': razonEvento, 'companyName': companyName,
                    'InsuredEvent': { code: eventoAsegurado, name: 'Salud-Ambulatorio', mode: tipoSiniestro, disabled: false }, 'elegibleCoverages': elegibleCoverages,
                    'claimType': tipoSiniestro, 'occurrence': ocurrence, 'notification': fechaDenuncia
                }
            }
        });
        if (!RepoClaim.ok) {
            strcheckdat['Siniestro'] = '<Problema con el siniestro>>' + RepoClaim.msg;
            return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
        }

        if (RepoClaim.outData[0]) siniestroId = RepoClaim.outData[0].id;
        await doCmd({ cmd: 'SetField', data: { 'entity': 'Claim', 'entityId': siniestroId, 'fieldValue': `code='${codigoClaim}'` } });
        await doCmd({ cmd: 'RepoClaim', data: { operation: 'GET', filter: `id='${siniestroId}'`, include: ['Claimer', 'Policy', 'Policy.Holder', 'Policy.Coverages', 'Policy.Coverages.Benefits', 'Policy.Coverages.Claims'] } });
        claim = RepoClaim.outData[0];
        return await actualizarCamposReclamo({
            claim: claim,
            eventoAsegurado: eventoAsegurado,
            idPrestacion: idPrestacion,
            indexDoc: indexDoc,
            indexPrest: indexPrest,
            pfeDoc: pfeDoc,
            pPolicyId: idPoliza,
            pValTotal: pValTotal,
            razonEvento: razonEvento,
            siniestroId: siniestroId,
            tabla: tabla,
            tipoSiniestro: tipoSiniestro
        });
    }
    /**/
    async function crearCargoAbono(claim, procesoId, valorTotal, prestacion, rutPrestador, nombrePrestador, copago, costoSocio, fechaDocumento, numeroDocumento, servicioAbonar) {
        let detalleCargo = {};
        detalleCargo.valorTotal = valorTotal;
        detalleCargo.copago = copago;
        detalleCargo.costoSocio = costoSocio;
        detalleCargo.rutBeneficiario = context.row.rutBen;
        detalleCargo.fechaDocumento = fechaDocumento;
        detalleCargo.numeroDocumento = numeroDocumento;
        detalleCargo.nombreBeneficiario = context.row.nombreBen + ' ' + context.row.paternoBen + ' ' + context.row.maternoBen;
        detalleCargo.tipoDocumento = null;
        detalleCargo.prestacion = prestacion;
        detalleCargo.rutPrestador = rutPrestador;
        detalleCargo.nombrePrestador = nombrePrestador;

        //let vPolicyId=context.row.idEmpresa.substring(0,context.row.idEmpresa.indexOf('-'));
        let vPolicyId = claim.lifePolicyId;

        /**03/01/2023 */
        if (contactId == '' || contactId == undefined || contactId == null) {
            let rutBeneficiario = agregarRutValidador(context.row['rutBen']);
            context.row.filter = `isPerson = 'true' and cnp = '${rutBeneficiario.trim()}'`;
            await doCmd({ cmd: 'GetContacts', data: { 'filter': context.row.filter } });
            if (!GetContacts.outData.length > 0) {
                strcheckdat['rutBeneficiario'] = '<no existente>>' + rutBeneficiario;
                return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
            } else {
                contactId = GetContacts.outData[0].id;
            };
        };

        let vCreditId = await getCreditId({ folioSrmcp: context.row['folioSrmcp'] });

        let vContextCargoAbono = {
            row: {
                creditId: vCreditId,
                folioOrigen: context.row.folioProducto,
                monto: valorTotal,
                tipo: ObtenerTipoCredito(),
                servicioAbonar: servicioAbonar,
                producto: 'CONS',
                contactId: contactId,
                policyId: vPolicyId,
                tProdCred: context.row.tProdCredito,
                procesoId: procesoId,
                detalleCargo: detalleCargo
            }
        };

        if (context.row['motDevolucion'] == null || context.row['motDevolucion'] == 0 || context.row['motDevolucion'] == '') {
            await doCmd({
                cmd: 'ExeChain', data: {
                    'chain': 'cmdCargoAbono', 'context': JSON.stringify(vContextCargoAbono)
                }
            });
        };
    }

    async function guardarForm(claim, tipoSiniestro, razonEvento, eventoAsegurado, idPrestacion, tabla, pfeDoc, pValTotal, pPolicyId, indexDoc, indexPrest) {

        //let procesoId = context.row['folioSrmcp'].split('-')[1];
        /**03/01/2023 */
        let procesoId = parseInt(context.row['folioSrmcp'].substring(3, context.row['folioSrmcp'].length)) || context.row['folioSrmcp'];
        indexPrest = indexPrest || 0
        await doCmd({ cmd: 'GetForms', data: { 'filter': 'id=410', noTracking: true } });
        var userValues = {};
        userValues['Liquidacion'] = JSON.parse(GetForms.outData[0].json);
        var nrow = Object.keys(datos).length;
        var nvalues = userValues['Liquidacion'].length;
        let idPrestacionSermecoop = tabla.filter(item => item.idPres == idPrestacion);
        idPrestacionSermecoop = (idPrestacionSermecoop.length > 0) ? idPrestacionSermecoop[0].idPresSer : '';
        let nombrePrestacionSermecoop = tabla.filter(item => item.idPres == idPrestacion);
        nombrePrestacionSermecoop = (nombrePrestacionSermecoop.length > 0) ? nombrePrestacionSermecoop[0].nombrePresSer : '';
        arrdata.push(idPrestacionSermecoop);
        userValues['Liquidacion'].filter(x => x.name == 'idPrestacionSermecoop')[0].userData = arrdata;
        arrdata = [];
        arrdata.push(nombrePrestacionSermecoop);
        userValues['Liquidacion'].filter(x => x.name == 'nombrePrestacionSermecoop')[0].userData = arrdata;
        arrdata = [];
        try {
            if (context.row['cantDocs'] >= 1) {
                for (var i = 0; i <= nrow - 1; i++) {
                    for (var j = 0; j <= nvalues - 1; j++) {
                        if (Object.keys(datos)[i] == userValues['Liquidacion'][j].name) {
                            if (['fePago', 'feRecepcion', 'feProceso', 'feDoc'].includes(datos[Object.keys(datos)[i]])) {
                                if (datos[Object.keys(datos)[i]] == 'feDoc') {
                                    arrdata.push(getFormatedDateString(context.row['listaDocs'][indexDoc]['listaPrest'][indexPrest][datos[Object.keys(datos)[i]]]));
                                } else {
                                    arrdata.push(getFormatedDateString(context.row[datos[Object.keys(datos)[i]]]));
                                }
                                userValues['Liquidacion'].filter(x => x.name == userValues['Liquidacion'][j].name)[0].userData = arrdata;

                            } else if (datos[Object.keys(datos)[i]] == 'rutAfi' || datos[Object.keys(datos)[i]] == 'rutBen' || datos[Object.keys(datos)[i]] == 'rutPrest') {
                                if (datos[Object.keys(datos)[i]] == 'rutPrest') {
                                    arrdata.push(agregarRutValidador(context.row['listaDocs'][indexDoc][datos[Object.keys(datos)[i]]]));
                                } else {
                                    arrdata.push(agregarRutValidador(context.row[datos[Object.keys(datos)[i]]]));
                                }
                                userValues['Liquidacion'].filter(x => x.name == userValues['Liquidacion'][j].name)[0].userData = arrdata;
                            } else {
                                if (datos[Object.keys(datos)[i]] == 'nombrePrestador' || datos[Object.keys(datos)[i]] == 'numDoc') {
                                    arrdata.push(context.row['listaDocs'][indexDoc][datos[Object.keys(datos)[i]]]);
                                } else if (datos[Object.keys(datos)[i]] == 'folioFGR') {
                                    arrdata.push(context.row['folioProducto']);
                                } else if (['idPrest', 'nombrePrestacion', 'valTotal', 'bonoSistSalud', 'copago', 'montoAfecto', 'beneficioSrmcp', 'porcentajeBonif', 'costoSocio', 'montoDeducible'].includes(datos[Object.keys(datos)[i]])) {

                                    arrdata.push(context.row['listaDocs'][indexDoc]['listaPrest'][indexPrest][datos[Object.keys(datos)[i]]]);
                                } else {
                                    arrdata.push(context.row[datos[Object.keys(datos)[i]]]);
                                }

                                userValues['Liquidacion'].filter(x => x.name == userValues['Liquidacion'][j].name)[0].userData = arrdata;
                            }
                            arrdata = [];
                        }
                    }
                }
            }
        } catch (error) {

        }

        //let valorTotal = userValues['Liquidacion'].filter(x => x.name == 'valorTotal');
        //valorTotal = valorTotal.length > 0 && valorTotal[0].userData && valorTotal[0].userData.length > 0 ? parseFloat(valorTotal[0].userData[0]) : 0;

        //let creditCustomData = getCreditCustomData({ folioSrmcp: context.row['folioSrmcp'] });
        //let valorTotal = creditCustomData.montoCredito || 0;

        let valorTotal = userValues['Liquidacion'].filter(x => x.name == 'bonificacionSermecoop');
        valorTotal = valorTotal.length > 0 && valorTotal[0].userData && valorTotal[0].userData.length > 0 ? parseFloat(valorTotal[0].userData[0]) : 0;

        let prestacion = userValues['Liquidacion'].filter(x => x.name == 'nombrePrestacionCTA');
        prestacion = prestacion.length > 0 && prestacion[0].userData && prestacion[0].userData.length > 0 ? prestacion[0].userData[0] : '';
        let rutPrestador = userValues['Liquidacion'].filter(x => x.name == 'rutPrestador');
        rutPrestador = rutPrestador.length > 0 && rutPrestador[0].userData && rutPrestador[0].userData.length > 0 ? rutPrestador[0].userData[0] : '';
        let nombrePrestador = userValues['Liquidacion'].filter(x => x.name == 'nombrePrestador');
        nombrePrestador = nombrePrestador.length > 0 && nombrePrestador[0].userData && nombrePrestador[0].userData.length > 0 ? nombrePrestador[0].userData[0] : '';
        let copago = userValues['Liquidacion'].filter(x => x.name == 'copago');
        copago = copago.length > 0 && copago[0].userData && copago[0].userData.length > 0 ? parseFloat(copago[0].userData[0]) : 0;
        let costoSocio = userValues['Liquidacion'].filter(x => x.name == 'costoSocio');
        costoSocio = costoSocio.length > 0 && costoSocio[0].userData && costoSocio[0].userData.length > 0 ? parseFloat(costoSocio[0].userData[0]) : 0;
        let fechaDoc = userValues['Liquidacion'].filter(x => x.name == 'fechaDocumento');
        fechaDoc = fechaDoc.length > 0 && fechaDoc[0].userData && fechaDoc[0].userData.length > 0 ? fechaDoc[0].userData[0] : '';
        let numDoc = userValues['Liquidacion'].filter(x => x.name == 'numeroDocumento');
        numDoc = numDoc.length > 0 && numDoc[0].userData && numDoc[0].userData.length > 0 ? numDoc[0].userData[0] : '';

        /**Agregado a solicitud de BA 03/01/2023 por FNUÑEZ */
        if (context.row['motDevolucion'] == null || context.row['motDevolucion'] == 0 || context.row['motDevolucion'] == '') {
            let arrCargosAbonos = [3, 4, 5, 6, 19]
            if (arrCargosAbonos.includes(parseFloat(context.row['tProdCredito']))) {
                ;
                let vServicioAbonar = null;
                switch (parseFloat(context.row['tProdCredito'])) {
                    case 3:
                        vServicioAbonar = 1 //Préstamo
                        break;
                    case 4:
                        vServicioAbonar = 2 //Carta de Resguardo
                        break;
                    case 5:
                        vServicioAbonar = 3 //OAT
                        break;
                }
                await crearCargoAbono(claim, procesoId, valorTotal, prestacion, rutPrestador, nombrePrestador, copago, costoSocio, fechaDoc, numDoc, vServicioAbonar);
            };
        };

        let coverage = null;
        for (var k = 0; k < claim.Policy.Coverages.length; k++) {
            let benefits = claim.Policy.Coverages[k].Benefits.filter(be => be.code == idPrestacion);
            if (benefits.length > 0) {
                coverage = claim.Policy.Coverages[k];
            }
        }
        let fechaValida = typeof pfeDoc === 'string' ? pfeDoc : context.row['listaDocs'][0]['listaPrest'][0]['feDoc'];
        let feDo = getFormatedDateString(fechaValida);
        let fecha = new Date();
        fecha.setHours(0);
        fecha.setMinutes(0);
        fecha.setSeconds(0);
        fecha.setMilliseconds(0);
        await doCmd({
            cmd: 'RepoLifeCoverageClaimHosp', data: {
                'operation': 'ADD', 'entity': {
                    'jClaimForm': JSON.stringify(userValues['Liquidacion']), 'created': feDo, 'eventDate': fecha,
                    'dateOfAdmission': fecha, 'dateOfDischarge': fecha, 'appliesTo': coverage.appliesTo,
                    'bonusPercentage': 0, 'bonusSumAssured': 0, 'contractStatusReason': 'Ingreso Solicitud Propuesta Comercial',
                    'coverageEndDate': claim.occurrence,
                    'claimType': tipoSiniestro, 'claimId': claim.id, 'lifeCoverageId': coverage.id, 'eventNumber': coverage.number
                }
            }
        });
        await doCmd({ cmd: 'GetCurrentUser', data: {} });
        await doCmd({ cmd: 'GetPing', data: { userValues: JSON.stringify(userValues['Liquidacion']) } });

        let valorUF = parseFloat(userValues['Liquidacion'].filter(x => x.name == 'uf')[0].userData);
        const objectValues = userValues['Liquidacion'].filter(item => item.userData).reduce((form, item) => { form[item.name] = item.userData.pop(); return form; });
        let myObs = `Id Contacto Beneficiario: ${claim.claimerId} | Nombre Beneficiario: ${claim.Claimer.FullName} | Número de documento: ${objectValues.numeroDocumento || ''}  | Observaciones: ${objectValues.observacion || ''}`;
        //let myObs = 'ID Contacto Beneficiario: ' + claim.claimerId + ' | Nombre Beneficiario: ' + claim.Claimer.FullName + ' | Número de documento: ' + userValues['Liquidacion'].filter(x => x.name == 'numeroDocumento')[0].userData[0] + ' | Observaciones: ' + userValues['Liquidacion'].filter(x => x.name == 'observacion')[0].userData[0];
        let myProcedureData = {
            claimId: claim.id,
            cptCode: idPrestacion,
            fechaDoc: objectValues.fechaDocumento || new Date().toISOString(),    //userValues['Liquidacion'].filter(x => x.name == 'fechaDocumento')[0].userData[0],
            afecto: (Number(objectValues.montoAfecto || 0) / valorUF).toFixed(2), //(parseFloat(userValues['Liquidacion'].filter(x => x.name == 'montoAfecto')[0].userData) / valorUF).toFixed(2),
            rutProvedor: objectValues.rutPrestador || objectValues.rutAfiliado || '', //userValues['Liquidacion'].filter(x => x.name == 'rutPrestador')[0].userData[0],
            covCode: coverage.code,
            benCode: idPrestacion,
            bonificado: (Number(objectValues.bonificacionSermecoop || 0) / valorUF).toFixed(2),//(parseFloat(userValues['Liquidacion'].filter(x => x.name == 'bonificacionSermecoop')[0].userData) / valorUF).toFixed(2),
            costoSocio: (Number(objectValues.costoSocio || 0) / valorUF).toFixed(2),//(parseFloat(userValues['Liquidacion'].filter(x => x.name == 'costoSocio')[0].userData) / valorUF).toFixed(2),
            rechazo: objectValues.motivoDevolucion || '',//userValues['Liquidacion'].filter(x => x.name == 'motivoDevolucion')[0].userData[0],
            status: 3,
            polId: claim.Policy.id,
            covId: coverage.id,
            fechaProceso: objectValues.fechaProceso || '',//userValues['Liquidacion'].filter(x => x.name == 'fechaProceso')[0].userData[0],
            myUser: GetCurrentUser.outData.email,
            fObservacion: myObs,
            deducible: Number((objectValues.montoDeducible || 0) / valorUF).toFixed(2),//(parseFloat(userValues['Liquidacion'].filter(x => x.name == 'montoDeducible')[0].userData) / valorUF).toFixed(2),
            copago: Number((objectValues.copago || 0) / valorUF).toFixed(2) //(parseFloat(userValues['Liquidacion'].filter(x => x.name == 'copago')[0].userData) / valorUF).toFixed(2),
        };
        //Aca debe hacer referencia al chain cmdGuardar Procedure
        await doCmd({ cmd: 'ExeChain', data: { chain: 'cmdGuardarProcedure', context: '{row: ' + JSON.stringify(myProcedureData) + '}' } })
        let procedimiento = ExeChain.outData;
        if (RepoLifeCoverageClaimHosp.ok) {
            strcheckdat = {};
            //solo aplica cuando no hay devolución (motDevolucion = 0)
            if (context.row['motDevolucion'] == null || context.row['motDevolucion'] == 0 || context.row['motDevolucion'] == '') {
                if (context.row['tProdCredito'] == 5 || context.row['tProdCredito'] == 4 || context.row['tProdCredito'] == 3 || context.row['tProdCredito'] == 6) {
                    //await doCmd({ cmd: 'ExeChain', data: { 'chain': 'cmdEnviarMontoCargaYAbono', 'context': '{row:{folioSermeecop:'' + context.row['folioSrmcp'] + '', tProdCredito:'' + context.row['tProdCredito'] + '', bonificacionSermecoop:'' + context.row['listaDocs'][0]['listaPrest'][0]['beneficioSrmcp'] + '', valorTotal:'' + context.row['listaDocs'][0]['listaPrest'][0]['valTotal'] + '', policyId:'' + context.row['idEmpresa'] + ''}}' } });
                    let valTransaccion = context.row['tProdCredito'] != 6 ? valorTotal : pValTotal;
                    let vtipoMov = context.row['tProdCredito'] != 6 ? 2 : 1; //2 es abono; 1 es cargo
                    let cargoAbono52 = {
                        tipoMov: vtipoMov,
                        folioSermecoop: context.row['folioSrmcp'],
                        //valorTotal: pValTotal,
                        valorTotal: valTransaccion,
                        bonificacionSermecoop: parseFloat(userValues['Liquidacion'].filter(x => x.name == 'bonificacionSermecoop')[0].userData),
                        policyId: pPolicyId,
                        tProdCredito: context.row['tProdCredito'],
                        idSisnet: RepoLifeCoverageClaimHosp.outData[0].id,
                        rutPrestador: myProcedureData.rutProvedor,
                        rutAfiliado: userValues['Liquidacion'].filter(x => x.name == 'rutAfiliado')[0].userData[0],
                        nroDocumento: userValues['Liquidacion'].filter(x => x.name == 'numeroDocumento')[0].userData[0],
                    };
                    await doCmd({ cmd: 'GetPing', data: { myvalues: cargoAbono52 } });
                    await doCmd({
                        cmd: 'ExeChain', data: {
                            'chain': 'cmdEnviarMontoCargaYAbono',
                            'context': '{row:' + JSON.stringify(cargoAbono52) + '}'
                        }
                    });

                    strcheckdat['Carga Interconexión'] = ExeChain.outData.msgCarga;
                    strcheckdat['Abono interconexión'] = ExeChain.outData.msgAbono;
                };
            };

            await doCmd({ cmd: 'GetTable', data: { table: 'tblParamGeneral', column: 'parameter', row: 'PRODCREDNOVALINTERCON', getColumn: 'value', notFoundValue: '-', useCache: false } });
            let vTProdCredNoVal = GetTable.outData;
            let vArrTProdCredNoVal = vTProdCredNoVal.split(',');

            for (let index = 0; index < vArrTProdCredNoVal.length; index++) {
                const element = vArrTProdCredNoVal[index];
                vArrTProdCredNoVal[index] = parseInt(element);
            };

            strcheckdat['codigoCorrecto'] = '1';
            strcheckdat['descripcionCorrecto'] = 'Correcto'
            strcheckdat['status'] = 'Liquidacion de Siniestro Registrada Exitosamente';
            strcheckdat['Codigo Envio'] = context.row['codEnvio'];
            strcheckdat['SiniestroId'] = claim.id;
            strcheckdat['Numero Liquidación'] = context.row['numLiqui'];
            strcheckdat['RegistroProcedimiento'] = procedimiento.msg1;
            strcheckdat['RegistroReserva'] = procedimiento.msg2;
            strcheckdat['RegistroPago'] = procedimiento.msg3;
            strcheckdat['AutorizaciónPago'] = procedimiento.msg4;
            strcheckdat['CodLiqui'] = RepoLifeCoverageClaimHosp.outData[0].id;
            vCodLiquiGenerado = RepoLifeCoverageClaimHosp.outData[0].id;

            if (!vArrTProdCredNoVal.includes(context.row['tProdCredito'])) {
                if (context.row['motDevolucion'] == null || context.row['motDevolucion'] == 0 || context.row['motDevolucion'] == '') {
                    await doCmd({ cmd: 'ExeChain', data: { 'chain': 'cmdObtenerLiquidacionesCta', 'context': `{row:{id:'${RepoLifeCoverageClaimHosp.outData[0].id}'}}` } });
                    if (!ExeChain.outData.ok) {
                        if (ExeChain.outData.StatusData.CENTROCOSTO != null) {
                            strcheckdat['Centro Costo'] = ExeChain.outData.StatusData.CENTROCOSTO;
                        }
                        if (ExeChain.outData.StatusData.TABLAHOMOLOGACION != null) {
                            strcheckdat['Tabla Homologacion'] = ExeChain.outData.StatusData.TABLAHOMOLOGACION;
                        }
                        if (ExeChain.outData.StatusData.CuentaContable != null) {
                            strcheckdat['Cuenta Contable'] = ExeChain.outData.StatusData.CuentaContable;
                        }
                        if (ExeChain.outData.StatusData.RespuestasucursalVirtual != null) {
                            strcheckdat['Respuesta Sucursal Virtual'] = ExeChain.outData.StatusData.RespuestasucursalVirtual;
                        }
                        if (ExeChain.outData.StatusData.Siniestro != null) {
                            strcheckdat['Error Siniestro'] = ExeChain.outData.StatusData.Siniestro;
                        };
                    };
                };
            };

            arrcheckdat.push(strcheckdat);
            JstatusData = JSON.parse(JSON.stringify(arrcheckdat));
            return { Ok: true, msg: 'Proceso satisfactorio', StatusData: JstatusData };
        } else {
            strcheckdat['Siniestro'] = '<Problema al guardar la Liquidacion>>' + RepoLifeCoverageClaimHosp.msg;
            return { Ok: false, msg: 'Data inválida', StatusData: responseerror(strcheckdat) };
        };
    };

    try {
        /**Obtenemos el codigo de envio generado en la interconexion RQ1 - WF 311 3.1.Solicitud de Reembolso (Liquidador Externo) */
        let vSqlRequestSettlement = `SELECT 
        JSON_VALUE(b.json,'$[6].userData[0]') as codEnvio,
        JSON_VALUE(b.json,'$[4].userData[0]') as cantLiq
        FROM proceso as a inner join userValues as b on (a.id=b.procesoId)
	    WHERE a.definitionId=311 and b.formualarioId=511
        AND ISNULL(JSON_VALUE(b.json,'$[6].userData[0]'), '') = ${context.row['codEnvio']}`;
        await doCmd({ cmd: 'DoQuery', data: { sql: vSqlRequestSettlement } });
        var vSolicitudesEnvio = DoQuery.outData;

        //return vSolicitudesEnvio;

    } catch (error) {
        return responseerror2(strcheckdat, -1, 'Obtenemos el codigo de envio generado');
    }


    if (!vSolicitudesEnvio.some(a => a.codEnvio == context.row['codEnvio'])) {
        strcheckdat['Solicitud Envío'] = '< Código de envío no existe en SisNet>>' + context.row['codEnvio'];
        return { Ok: false, msg: 'Código de envío no encontrado', StatusData: responseerror(strcheckdat) };
    };
    let vSolicEnvioValido = vSolicitudesEnvio.find(a => a.codEnvio == context.row['codEnvio']);

    if (parseFloat(context.row['numLiqui']) > vSolicEnvioValido.cantLiq) {
        strcheckdat['Envío Liquidación Siniestro'] = '< Ha superado la cantidad de liquidaciones permitidas para este lote>> CantLiq: ' + vSolicEnvioValido.cantLiq + ' numLiqui: ' + parseFloat(context.row['numLiqui']);
        return { Ok: false, msg: 'Número de Liquidación mayor a cantidad de liquidaciones esperadas.', StatusData: responseerror(strcheckdat) };
    };

    /********************************* */
    await doCmd({ cmd: 'GetFullTable', data: { table: 'Tabla Homologacion Sermecoop' } });
    let tabla = GetFullTable.outData;
    tabla = tabla.map(j => { return { idPres: j[0], tipoSin: j[3], idPresSer: j[4], nombrePresSer: j[5] } });
    await doCmd({ cmd: 'RepoClaim', data: { operation: 'GET', filter: `code='${context.row['folioSrmcp']}'`, include: ['Claimer', 'Policy', 'Policy.Holder', 'Policy.Coverages', 'Policy.Coverages.Benefits', 'Policy.Coverages.Claims'], page: 0, size: 1 } });
    var claim = RepoClaim.outData[0];

    if (!claim && !(context.row['tProdCredito'] == 10 || context.row['tProdCredito'] == 18 || context.row['tProdCredito'] == 8 || context.row['tProdCredito'] == 7 || context.row['tProdCredito'] == 3 || context.row['tProdCredito'] == 4 || context.row['tProdCredito'] == 5 || context.row['tProdCredito'] == 6 || context.row['tProdCredito'] == 9 || context.row['tProdCredito'] == 11 || context.row['tProdCredito'] == 12 || context.row['tProdCredito'] == 13 || context.row['tProdCredito'] == 20 || context.row['tProdCredito'] == 19)) {
        strcheckdat['Siniestro'] = 'no se encontro siniestro en el Sistema>' + context.row['folioSrmcp'].trim();
        return { Ok: false, msg: 'Siniestro no encontrado', StatusData: responseerror(strcheckdat) };
    }

    strcheckdat['ValidacionPreviaLiquidacion'] = [];
    strcheckdat['ValidacionPreviaLiquidacion'] = await valLiquidacion();
    if (strcheckdat['ValidacionPreviaLiquidacion'].length > 0) {
        return responseerror2(strcheckdat, -1, 'Los datos de la liquidación son inválidos.');
    };

    strcheckdat['ValidacionPreviaDocumentos'] = [];
    strcheckdat['ValidacionPreviaDocumentos'] = await valDocumentos(context.row.listaDocs);
    if (strcheckdat['ValidacionPreviaDocumentos'].length > 0) {
        return responseerror2(strcheckdat, -1, 'Los documentos no pasaron las validaciones previas.');
    };

    var vResultData = '';

    const EventProduct = [
        { codigos: [20, 11, 12, 13], razonEvento: 'CL-EVR-001', eventoAsegurado: 'CL-EV-001', tipoSiniestro: 'AMBU' },
        { codigos: [10, 5], razonEvento: 'CL-EVR-002', eventoAsegurado: 'CL-EV-001', tipoSiniestro: 'AMBU' },
        { codigos: [9, 4], razonEvento: 'CL-EVR-002', eventoAsegurado: 'CL-EV-002', tipoSiniestro: 'HOSP' },

    ]

    for (let m = 0; m < context.row.listaDocs.length; m++) {
        var element = context.row.listaDocs[m];
        /**Agregado por FNUNEZ 2023-01-04 */
        strcheckdat['ValidacionPreviaPrestaciones'] = [];
        strcheckdat['ValidacionPreviaPrestaciones'] = valPrestaciones(element.listaPrest, tabla);
        if (strcheckdat['ValidacionPreviaPrestaciones'].length > 0) {
            return responseerror2(strcheckdat, -1, 'Las prestaciones no pasaron las validaciones previas.');
            //return vdatos;
        };
        for (let n = 0; n < element.listaPrest.length; n++) {
            var element2 = element.listaPrest[n];
            let idPoliza = context.row['idEmpresa'];
            idPoliza = idPoliza.substring(0, idPoliza.indexOf('-'));
            let pfeDoc = element2['feDoc'];
            let vValTotal = element2['valTotal'];
            let idprestacionCta = element2['idPrest'];
            let tipoProductoCredito = Number(context.row['tProdCredito']);

            if (context.row['tProdCredito'] == 0) {
                let razonEvento = 'CL-EVR-001';
                let eventoAsegurado = 'CL-EV-';
                let tipoSiniestro = tabla.find(item => item.idPres == idprestacionCta);

                if (!tipoSiniestro) {
                    strcheckdat['Validaciones'].push({ TipoSiniestro: 'Id Prestacion CTA no se encuentra en la tabla de homologación del Sistema>' + idprestacionCta });
                    return responseerror2(strcheckdat, -1, 'Las prestaciones no pasaron las validaciones.');
                }

                tipoSiniestro = tipoSiniestro.tipoSin;
                let nombrePlan = context.row['nombrePlan'] || '';
                const nombrePlanUpper = nombrePlan.toUpperCase();

                if (nombrePlanUpper.includes('SALUD')) {
                    if (tipoSiniestro == 'AMBU') {
                        eventoAsegurado += '001';
                    } else if (tipoSiniestro == 'HOSP') {
                        eventoAsegurado += '002';
                    } else if (tipoSiniestro == 'CATA') {
                        eventoAsegurado += '003';
                    }
                } else if (nombrePlanUpper.includes('DENTAL')) {
                    if (tipoSiniestro == 'DENT') {
                        eventoAsegurado += '004';
                    }
                } else if (nombrePlanUpper.includes('AMPLIADO')) {
                    if (tipoSiniestro == 'AMBU') {
                        eventoAsegurado += '005';
                    } else if (tipoSiniestro == 'HOSP') {
                        eventoAsegurado += '006';
                    }
                } else if (nombrePlanUpper.includes('FASEC')) {
                    if (tipoSiniestro == 'AMBU') {
                        eventoAsegurado += '007';
                    } else if (tipoSiniestro == 'HOSP') {
                        eventoAsegurado += '008';
                    } else if (tipoSiniestro == 'DENT') {
                        eventoAsegurado += '009';
                    }
                }

                let siniestroId = claim.id;
                vResultData = await actualizarCamposRecslamo({
                    claim: claim,
                    eventoAsegurado: eventoAsegurado,
                    idPrestacion: idprestacionCta,
                    indexDoc: m,
                    indexPrest: n,
                    pfeDoc: pfeDoc,
                    pPolicyId: idPoliza,
                    pValTotal: vValTotal,
                    razonEvento: razonEvento,
                    siniestroId: siniestroId,
                    tabla: tabla,
                    tipoSiniestro: tipoSiniestro
                });
                if (!vResultData.Ok) {
                    return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones.');
                };
            } else if ([20, 11, 12, 13].includes(tipoProductoCredito)) {
                let [config] = EventProduct.filter(con => con.codigos.includes(tipoProductoCredito));
                let { razonEvento, eventoAsegurado, tipoSiniestro } = config;

                vResultData = await insertarReclamo({
                    tipoSiniestro: tipoSiniestro,
                    razonEvento: razonEvento,
                    eventoAsegurado: eventoAsegurado,
                    idPrestacion: idprestacionCta,
                    tabla: tabla,
                    pfeDoc: pfeDoc,
                    indexDoc: m,
                    indexPrest: n,
                    pValTotal: vValTotal
                })
                if (!vResultData.Ok) {
                    return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones.');
                };
            } else if ([9, 4, 5, 10].includes(tipoProductoCredito)) {
                let [config] = EventProduct.filter(con => con.codigos.includes(tipoProductoCredito));
                let { razonEvento, eventoAsegurado, tipoSiniestro } = config;

                if (claim) {
                    let siniestroId = claim.id;
                    vResultData = await actualizarCamposReclamo({
                        claim: claim,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        indexDoc: m,
                        indexPrest: n,
                        pfeDoc: pfeDoc,
                        pPolicyId: idPoliza,
                        pValTotal: vValTotal,
                        razonEvento: razonEvento,
                        siniestroId: siniestroId,
                        tabla: tabla,
                        tipoSiniestro: tipoSiniestro
                    });
                } else
                    vResultData = await insertarReclamo({
                        tipoSiniestro: tipoSiniestro,
                        razonEvento: razonEvento,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        tabla: tabla,
                        pfeDoc: pfeDoc,
                        indexDoc: m,
                        indexPrest: n,
                        pValTotal: vValTotal
                    })

                if (!vResultData.Ok) {
                    return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones.');
                };
            } else if (tipoProductoCredito == 6) {

                let razonEvento = 'CL-EVR-002';
                let eventoAsegurado = 'CL-EV-';
                let tipoSiniestro = tabla.filter(item => item.idPres == idprestacionCta);
                if (tipoSiniestro.length > 0) {
                    tipoSiniestro = tipoSiniestro[0].tipoSin;
                } else {
                    strcheckdat['Validaciones'].push({ TipoSiniestro: ' Id Prestacion CTA no se encuentra  en la tabla de homologación del  Sistema>' + idprestacionCta });
                    return responseerror2(strcheckdat, -1, 'Las prestaciones no pasaron las validaciones.');
                }
                let nombrePlan = context.row['nombrePlan'];
                if (nombrePlan.toUpperCase().includes('salud'.toUpperCase())) {
                    if (tipoSiniestro == 'AMBU') {
                        eventoAsegurado = eventoAsegurado + '001';
                    } else if (tipoSiniestro == 'HOSP') {
                        eventoAsegurado = eventoAsegurado + '002';
                    }
                }
                if (claim) {
                    let siniestroId = claim.id;
                    vResultData = await actualizarCamposReclamo({
                        claim: claim,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        indexDoc: m,
                        indexPrest: n,
                        pfeDoc: pfeDoc,
                        pPolicyId: idPoliza,
                        pValTotal: vValTotal,
                        razonEvento: razonEvento,
                        siniestroId: siniestroId,
                        tabla: tabla,
                        tipoSiniestro: tipoSiniestro
                    });
                } else {
                    vResultData = await insertarReclamo({
                        tipoSiniestro: tipoSiniestro,
                        razonEvento: razonEvento,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        tabla: tabla,
                        pfeDoc: pfeDoc,
                        indexDoc: m,
                        indexPrest: n,
                        pValTotal: vValTotal
                    })
                };
                if (!vResultData.Ok) {
                    return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones.');
                };
            } else if (context.row['tProdCredito'] == 8) {
                let razonEvento = 'CL-EVR-002';
                let eventoAsegurado = 'CL-EV-';
                let [result] = tabla.filter(item => item.idPres == idprestacionCta);
                let tipoSiniestro = '';
                if (typeof result === 'undefined' || result == null) {
                    strcheckdat['Validaciones'].push({ TipoSiniestro: ' Id Prestacion CTA no se encuentra  en la tabla de homologación del  Sistema>' + idprestacionCta });
                    return responseerror2(strcheckdat, -1, 'Las prestaciones no pasaron las validaciones.');
                } else {
                    tipoSiniestro = result.tipoSin;
                }

                let nombrePlan = context.row['nombrePlan'].toUpperCase();
                switch (nombrePlan) {
                    case 'SALUD': eventoAsegurado += tipoSiniestro == 'AMBU' ? '001' : tipoSiniestro == 'HOSP' ? '002' : ''; break;
                    case 'DENTAL': eventoAsegurado += tipoSiniestro == 'DENT' ? '004' : ''; break;
                    case 'FASEC': eventoAsegurado += tipoSiniestro == 'AMBU' ? '007' : tipoSiniestro == 'HOSP' ? '008' : tipoSiniestro == 'DENT' ? '009' : ''; break;
                }

                if (claim) {
                    let siniestroId = claim.id;
                    vResultData = await actualizarCamposReclamo({
                        claim: claim,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        indexDoc: m,
                        indexPrest: n,
                        pfeDoc: pfeDoc,
                        pPolicyId: idPoliza,
                        pValTotal: vValTotal,
                        razonEvento: razonEvento,
                        siniestroId: siniestroId,
                        tabla: tabla,
                        tipoSiniestro: tipoSiniestro
                    });
                } else {
                    vResultData = await insertarReclamo({
                        tipoSiniestro: tipoSiniestro,
                        razonEvento: razonEvento,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        tabla: tabla,
                        pfeDoc: pfeDoc,
                        indexDoc: m,
                        indexPrest: n,
                        pValTotal: vValTotal
                    })
                };
                if (!vResultData.Ok) {
                    return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones.');
                };
            } else if (context.row['tProdCredito'] == 3) {

                let razonEvento = 'CL-EVR-002';
                let eventoAsegurado = 'CL-EV-';
                let tipoSiniestro = tabla.filter(item => item.idPres == idprestacionCta);
                if (tipoSiniestro.length > 0) {
                    tipoSiniestro = tipoSiniestro[0].tipoSin;
                } else {
                    strcheckdat['Validaciones'].push({ TipoSiniestro: ' Id Prestacion CTA no se encuentra  en la tabla de homologación del  Sistema>' + idprestacionCta });
                    return responseerror2(strcheckdat, -1, 'Las prestaciones no pasaron las validaciones.');
                }
                let nombrePlan = context.row['nombrePlan'];
                if (nombrePlan.toUpperCase().includes('salud'.toUpperCase())) {
                    if (tipoSiniestro == 'AMBU') {
                        eventoAsegurado = eventoAsegurado + '001';
                    } else if (tipoSiniestro == 'HOSP') {
                        eventoAsegurado = eventoAsegurado + '002';
                    }
                } else if (nombrePlan.toUpperCase().includes('dental'.toUpperCase())) {
                    if (tipoSiniestro == 'DENT') {
                        eventoAsegurado = eventoAsegurado + '004';
                    }
                } else if (nombrePlan.toUpperCase().includes('fasec'.toUpperCase())) {
                    if (tipoSiniestro == 'AMBU') {
                        eventoAsegurado = eventoAsegurado + '007';
                    } else if (tipoSiniestro == 'HOSP') {
                        eventoAsegurado = eventoAsegurado + '008';
                    } else if (tipoSiniestro == 'DENT') {
                        eventoAsegurado = eventoAsegurado + '009';
                    }
                }
                if (claim) {
                    let siniestroId = claim.id;
                    vResultData = await actualizarCamposReclamo({
                        claim: claim,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        indexDoc: m,
                        indexPrest: n,
                        pfeDoc: pfeDoc,
                        pPolicyId: idPoliza,
                        pValTotal: vValTotal,
                        razonEvento: razonEvento,
                        siniestroId: siniestroId,
                        tabla: tabla,
                        tipoSiniestro: tipoSiniestro
                    });
                } else {
                    vResultData = await insertarReclamo({
                        tipoSiniestro: tipoSiniestro,
                        razonEvento: razonEvento,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        tabla: tabla,
                        pfeDoc: pfeDoc,
                        indexDoc: m,
                        indexPrest: n,
                        pValTotal: vValTotal
                    })
                };

                if (!vResultData.Ok) {
                    return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones.');
                };
            } else if (context.row['tProdCredito'] == 7) {

                let razonEvento = 'CL-EVR-001';
                let eventoAsegurado = 'CL-EV-004';
                let tipoSiniestro = 'DENT';
                if (claim) {
                    let siniestroId = claim.id;
                    vResultData = await actualizarCamposReclamo({
                        claim: claim,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        indexDoc: m,
                        indexPrest: n,
                        pfeDoc: pfeDoc,
                        pPolicyId: idPoliza,
                        pValTotal: vValTotal,
                        razonEvento: razonEvento,
                        siniestroId: siniestroId,
                        tabla: tabla,
                        tipoSiniestro: tipoSiniestro
                    });
                } else {
                    vResultData = await insertarReclamo({
                        tipoSiniestro: tipoSiniestro,
                        razonEvento: razonEvento,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        tabla: tabla,
                        pfeDoc: pfeDoc,
                        indexDoc: m,
                        indexPrest: n,
                        pValTotal: vValTotal
                    })
                };
                if (!vResultData.Ok) {
                    return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones.');
                };
            } else if (context.row['tProdCredito'] == 18) {

                let razonEvento = 'CL-EVR-001';
                let eventoAsegurado = 'CL-EV-004';
                let tipoSiniestro = 'DENT';
                //return insertarReclamo(tipoSiniestro, razonEvento, eventoAsegurado, idprestacionCta, tabla, pfeDoc)
                if (claim) {
                    let siniestroId = claim.id;
                    vResultData = await actualizarCamposReclamo({
                        claim: claim,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        indexDoc: m,
                        indexPrest: n,
                        pfeDoc: pfeDoc,
                        pPolicyId: idPoliza,
                        pValTotal: vValTotal,
                        razonEvento: razonEvento,
                        siniestroId: siniestroId,
                        tabla: tabla,
                        tipoSiniestro: tipoSiniestro
                    });
                } else {
                    vResultData = await insertarReclamo({
                        tipoSiniestro: tipoSiniestro,
                        razonEvento: razonEvento,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        tabla: tabla,
                        pfeDoc: pfeDoc,
                        indexDoc: m,
                        indexPrest: n,
                        pValTotal: vValTotal
                    })
                };
                if (!vResultData.Ok) {
                    return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones.');
                };
            } else if (context.row['tProdCredito'] == 19) {
                let razonEvento = 'CL-EVR-002';
                let eventoAsegurado = 'CL-EV-';
                //idprestacionCta = context.row.listaDocs[0].listaPrest[0]['idPrest'];
                let tipoSiniestro = tabla.filter(item => item.idPres == idprestacionCta);
                if (tipoSiniestro.length > 0) {
                    tipoSiniestro = tipoSiniestro[0].tipoSin;
                } else {
                    strcheckdat['Validaciones'].push({ TipoSiniestro: ' Id Prestacion CTA no se encuentra  en la tabla de homologación del  Sistema>' + idprestacionCta });
                    return responseerror2(strcheckdat, -1, 'Las prestaciones no pasaron las validaciones.');
                }
                let nombrePlan = context.row['nombrePlan'];
                if (nombrePlan.toUpperCase().includes('salud'.toUpperCase())) {
                    if (tipoSiniestro == 'AMBU') {
                        eventoAsegurado = eventoAsegurado + '001';
                    } else if (tipoSiniestro == 'HOSP') {
                        eventoAsegurado = eventoAsegurado + '002';
                    }
                }
                //return insertarReclamo(tipoSiniestro, razonEvento, eventoAsegurado, idprestacionCta, tabla, pfeDoc)
                if (claim) {
                    let siniestroId = claim.id;
                    vResultData = await actualizarCamposReclamo({
                        claim: claim,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        indexDoc: m,
                        indexPrest: n,
                        pfeDoc: pfeDoc,
                        pPolicyId: idPoliza,
                        pValTotal: vValTotal,
                        razonEvento: razonEvento,
                        siniestroId: siniestroId,
                        tabla: tabla,
                        tipoSiniestro: tipoSiniestro
                    });
                } else {
                    vResultData = await insertarReclamo({
                        tipoSiniestro: tipoSiniestro,
                        razonEvento: razonEvento,
                        eventoAsegurado: eventoAsegurado,
                        idPrestacion: idprestacionCta,
                        tabla: tabla,
                        pfeDoc: pfeDoc,
                        indexDoc: m,
                        indexPrest: n,
                        pValTotal: vValTotal
                    })
                };
                if (!vResultData.Ok) {
                    return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones.');
                };
            };
        };
    };

    /**A solicitud de BA se ubica seccion de codigo que adelanta proceso una vez que todos los documentos y todas las prestaciones se procesen. */
    //let procesoId = context.row['folioSrmcp'].split('-')[1];
    /**03/01/2023 */
    let procesoId = parseInt(context.row['folioSrmcp'].substring(3, context.row['folioSrmcp'].length)) || context.row['folioSrmcp']

    //10, 9, 8 , 7, 5, 4, 3, 18, 6 y 19
    if (context.row['tProdCredito'] == 10 || context.row['tProdCredito'] == 19 || context.row['tProdCredito'] == 9 || context.row['tProdCredito'] == 8 || context.row['tProdCredito'] == 7 || context.row['tProdCredito'] == 5 || context.row['tProdCredito'] == 4 || context.row['tProdCredito'] == 3 || context.row['tProdCredito'] == 6 || context.row['tProdCredito'] == 18) {
        await doCmd({ cmd: 'DoQuery', data: { 'sql': 'SELECT id,blockedBy FROM Proceso WHERE blockedBy=' + procesoId } });
        var blockeadoPor = DoQuery.outData && DoQuery.outData.length > 0 ? DoQuery.outData[0].id : 0;
        blockeadoPor = blockeadoPor ? parseInt(blockeadoPor) : 0;
        let esError = '';
        esError = await adelantarProceso(procesoId); //adelanta proceso asociado a liquidación

        if (blockeadoPor > 0) {
            esError = await adelantarProceso(blockeadoPor); //adelanta proceso padre
            if (esError.esError) {
                strcheckdat['Sub Proceso Siniestro'] = '< No se puedo avanzar en el proceso>>' + esError.msg;
                //return responseerror2(strcheckdat,-1,'Hubo un error al procesar las prestaciones.');
            }
        }
        if (esError.esError) {
            strcheckdat['Proceso Siniestro'] = '< No se puedo avanzar en el proceso>>' + esError.msg;
            //return responseerror2(strcheckdat,-1,'Hubo un error al procesar las prestaciones.');
        }

    }

    /** Version #9 Actualizacion de creditos. */
    try {
        const { listaDocs, tProdCredito, folioSrmcp, folioProducto } = context.row;

        await updateCredit({
            capital: getCapital({ listaDocs: listaDocs }),
            folioSrmcp: folioSrmcp, tProductoCredito: tProdCredito,
            folioProducto: folioProducto
        });

    } catch (error) {
        vResultData.Ok = false;
    }

    if (vResultData.Ok == true) {
        var vRecord = {};
        vRecord['Resultado'] = vResultData.StatusData;
        return responseerror2(vRecord, vCodLiquiGenerado, 'Proceso satisfactorio.');
    } else {
        return responseerror2(strcheckdat, -1, 'Hubo un error al procesar las prestaciones55555.');
    }
    //#region  Version #9
    /**
     * Obtiene el nuevo capital del credito.
     * @param { Array } param.listaDocs Arreglo con la lista de los documentos.
     * @returns { Object } capital Number, monto Afecto Number, montoBonificado Number
     * @author Noel Obando
     * @version 1.0
     */
    function getCapital({ listaDocs }) {
        const { montoAfecto, montoBonificado } = listaDocs.reduce((totalDoc, docs) => {
            const valorPrestacion = docs.listaPrest.reduce((totalPrest, prest) => {
                totalPrest['montoAfecto'] = totalPrest['montoAfecto'] + Number(prest['montoAfecto']);
                totalPrest['montoBonificado'] = totalPrest['montoBonificado'] + Number(prest['beneficioSrmcp']);
                return totalPrest;
            }, {
                montoAfecto: 0,
                montoBonificado: 0
            });

            totalDoc['montoAfecto'] = totalDoc['montoAfecto'] + valorPrestacion['montoAfecto'];
            totalDoc['montoBonificado'] = totalDoc['montoBonificado'] + valorPrestacion['montoBonificado'];
            return totalDoc;
        }, {
            montoAfecto: 0,
            montoBonificado: 0
        });
        return { capital: montoAfecto - montoBonificado, montoAfecto, montoBonificado }
    }
    /**
     * Obtiene un numero de proceso crediticio basandose en el codigo del siniestro.
     * @param { String } param.folioSrmcp Codigo del siniestro en formato XXX0000000
     * @returns { Number } credit.id Numero de credito
     * @author Noel Obando
     * @version 1.0
     */
    async function getCreditId({ folioSrmcp }) {
        if (!isNaN(Number(folioSrmcp))) // Si no es 'NaN' es un numero fijo y no tiene credito porque no esta en el formato de caracteres + numero;
            return 0;
        const processId = Number(folioSrmcp.substring(3, folioSrmcp.length)); // Remueve los ceros a la izquierda.
        const query = `
        SELECT c.id FROM Credit c
        INNER JOIN Proceso p on p.entityId = c.id
        WHERE p.id = ${processId}
        AND p.entity = 'Credit'`;
        await doCmd({ cmd: 'DoQuery', data: { sql: query } });
        if (!DoQuery.ok || DoQuery.outData.length <= 0)
            return 0;
        const [credit] = DoQuery.outData;
        return credit.id;
    };

    /**
     * Actualiza la informacion de un credito basandose en el tipo de producto crediticio y folio de sermecoop.
     * @param { Object } param.capital Objeto con los valores de capital, montoAfecto y montoBonificado
     * @param { String } param.folioSrmcp Codigo del siniestro
     * @param { String } param.tProductoCredito Tipo de producto crediticio.
     * @returns { Object } OK boolean, msg String
     * @version 1.0
     * @author Noel Obando
     */
    async function updateCredit({ capital, folioSrmcp, tProductoCredito, folioProducto }) {

        const productosA = [8, 9, 10],  // No Actualiza estado; pero si el monto y el idCartola
            productosB = [3, 7, 4, 5, 6, 18];  // Si Actualiza estado y tambien el monto y el idCartola

        if (!productosA.includes(parseInt(tProductoCredito)) && !productosB.includes(parseInt(tProductoCredito))) {
            return 'No aplica para actualizar'; // No esta en ninguna lista de productos de credito, entonces no modificar.
        }
        const creditId = await getCreditId({ folioSrmcp });
        //return creditId
        if (creditId <= 0)
            return 'Credito no encontrado en el folio: ' + folioSrmcp; // No se ha ubicado el credito a modificar.

        // Update Capital.
        //await doCmd({ cmd: 'SetField', data: { entity: 'Credit', entityId: creditId, fieldValue: `capital=${capital.capital}` } });

        // Update customForm.
        await doCmd({ cmd: 'LoadEntity', data: { entity: 'Credit', filter: `id=${creditId}`, fields: 'jForm' } });
        let { outData: { jForm } } = LoadEntity;
        if (typeof jForm == 'undefined' || jForm == null || jForm.trim() == '')
            return 'Formulario personalizado no valido'; // No se puede editar un formulario vacio...
        // Update form values
        var form = JSON.parse(jForm);
        //obtiene estado original

        var estadoOriginal = form.filter(x => x.name == 'estadoSolicitud').pop().userData.pop();
        var estado = (productosB.includes(tProductoCredito) == true) ? 'Cargado en cuenta corriente' : estadoOriginal;

        //valida caso especial OPD
        if (tProductoCredito == 18 && estadoOriginal.trim().toLowerCase() != 'nulo') {
            estado = 'Respaldado';
        } else if (tProductoCredito == 18 && estadoOriginal.trim().toLowerCase() == 'nulo') {
            estado = estadoOriginal;
        };

        //valida caso tipo producto credito 7 
        if (tProductoCredito == 7) {
            estado = 'Entregado';
        }

        var [fecha] = new Date().toISOString().split('T');
        form.forEach(field => {
            switch (field.name) {
                case 'estadoSolicitud': (field.userData = field.userData || [])[0] = estado; break;
                case 'idCartola': (field.userData = field.userData || [])[0] = folioProducto; break;
                case 'fechaCargo': (field.userData = field.userData || [])[0] = fecha; break;
            }
        });

        if ((form.filter(item => item.name == 'tipoSolicitud')[0].userData == 'Solicitud OPD') && tProductoCredito == 7) {
            form.filter(item => item.name == 'monto')[0].userData = [capital.montoBonificado];
            //await doCmd({ cmd: 'ExeChain',data:{'chain':'cmdEmitirActivarCreditos2','context':'{row:{creditId:'+creditId+',procesoId:'+processId+'}}'}});
        }
        // Actualizar formulario y guardar los nuevos valores.
        jForm = JSON.stringify(form);
        // Sanitizar campos para evitar errores al guardar.
        // jForm.replace(/\\/g, '');
        // jForm.replace(/'/g, '''');
        const updateQuery = `
        UPDATE Credit SET
        jForm ='${jForm}'
        WHERE id=${creditId}`;
        await doCmd({ cmd: 'DoQuery', data: { sql: updateQuery } });
        return DoQuery;
    }
    //#endregion Version #9
}

main({
    row: {
        codEnvio: 145,
        numLiqui: 1,
        folioSrmcp: '624408912',
        folioProducto: 3126519,
        edoProducto: 1,
        idEmpresa: '17572-0',
        empresa: 'VIÑA FOLATRE LTDA',
        idPlan: 'PSalud',
        nombrePlan: 'Plan Salud',
        sistSaludAfi: 71,
        rutAfi: '18326004',
        nombreAfi: 'PABLO ESTEBAN',
        paternoAfi: 'MEDINA',
        maternoAfli: 'NAVARRO',
        feNacimientoAfi: '19921029',
        sexAfi: 'M',
        edoVigenciaAfi: 1,
        beneficiario: 0,
        rutBen: '18326004',
        nombreBen: 'PABLO ESTEBAN',
        paternoBen: 'MEDINA',
        maternoBen: 'NAVARRO',
        sistSaludBen: 71,
        feNacimientoBen: '18326004',
        sexBen: 'M',
        edoVigenciaBen: 1,
        feRecepcion: '20230525',
        fePago: '20230529',
        feProceso: '20230529',
        formaPago: 4,
        destPago: 4,
        tCredito: 2,
        tRespaldoCredito: 2,
        tProdCredito: 20,
        motDevolucion: null,
        origenLiquidacion: 3,
        obs: 'Operacion IMED',
        uf: '35580.4900',
        cantDocs: 1,
        listaDocs: [
            {
                rutPrest: '96942400',
                nombrePrestador: 'Redsalud Alameda Medico',
                folioFGR: '756851706',
                numDoc: '756851706',
                cantPrest: 1,
                listaPrest: [
                    {
                        idPrest: 'AMB020',
                        nombrePrestacion: 'Consulta Convenio Imed',
                        feDoc: '20230525',
                        valTotal: 21796,
                        bonoSistSalud: 18596,
                        copago: 3200,
                        montoAfecto: 0,
                        beneficioSrmcp: 1920,
                        porcentajeBonif: 60,
                        costoSocio: 1280,
                        montoDeducible: 0
                    },
                    {
                        idPrest: 'AMB020',
                        nombrePrestacion: 'Consulta Convenio Imed',
                        feDoc: '20230525',
                        valTotal: 21796,
                        bonoSistSalud: 18596,
                        copago: 3200,
                        montoAfecto: 0,
                        beneficioSrmcp: 2920,
                        porcentajeBonif: 60,
                        costoSocio: 280,
                        montoDeducible: 0
                    }
                ]
            },
            {
                rutPrest: '96942400',
                nombrePrestador: 'Redsalud Alameda Medico',
                folioFGR: '756851706',
                numDoc: '756851706',
                cantPrest: 1,
                listaPrest: [
                    {
                        idPrest: 'AMB020',
                        nombrePrestacion: 'Consulta Convenio Imed',
                        feDoc: '20230525',
                        valTotal: 21796,
                        bonoSistSalud: 18596,
                        copago: 3200,
                        montoAfecto: 0,
                        beneficioSrmcp: 1920,
                        porcentajeBonif: 60,
                        costoSocio: 1280,
                        montoDeducible: 0
                    },
                    {
                        idPrest: 'AMB020',
                        nombrePrestacion: 'Consulta Convenio Imed',
                        feDoc: '20230525',
                        valTotal: 21796,
                        bonoSistSalud: 18596,
                        copago: 3200,
                        montoAfecto: 0,
                        beneficioSrmcp: 2920,
                        porcentajeBonif: 60,
                        costoSocio: 280,
                        montoDeducible: 0
                    }
                ]
            },

        ]
    }
}).then( output => console.log(output))