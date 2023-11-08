const { doCmd } = require("../lib");

const cmdVidaSaldada = async context => {
    const {
        fNacimiento = '1981-09-15',
        fInicio     = '2011-01-05',
        fUltimaPrima= '2016-09-30',
        fControl    = '2021-12-31',
        sexo        = 'M',
        capital     = 18576923.0769231,
    } = context;
    const edadInicio = await GetDiffDates(fNacimiento, fInicio),
          aniosSal   = await GetDiffDates(fInicio, fUltimaPrima),
          VTD        = await GetVTD();
    
    const MaxVTD = VTD[ VTD.length - 1];
    // Obtener la tabla de mortalidad.
    await doCmd({cmd:'ExeChain', data:{ chain:'cmdGetTablaMortalidad', context:`{sexo:'${ sexo }'}`}});
    const { outData: TablaMortalidad } = ExeChain;
    const XT_limit = edadInicio + TablaMortalidad.length -1;
    const { lx: lxEdad, dx: dxEdad } = TablaMortalidad.find( item => item.x == edadInicio);

    const dataSet = Array.from({ length: XT_limit })
        .map( (_, x) => {
            const xt = edadInicio + x;
            const { lx, dx } = xt > 110 ? { lx: 0, dx: 0 } : TablaMortalidad.find( item => item.x == xt );                

            const t  = x,
                i  = (VTD.find( item => item.Plazo == x) || MaxVTD).EstresEmpirico,
                f3 = Math.pow(1 + i, - t),
                f4 = lx/lxEdad,
                f5 = f3 * f4,
                f6 = dxEdad/lx,
                f7 = Math.pow((1+i), -(t+1)),
                f8 = f6 * f7;
            return {
                xt,
                t,
                i,
                f3,
                f4, 
                f5,
                f6
            }
        });

    return dataSet


    
    
    
    async function GetDiffDates(inicio, fin){
        await doCmd({ cmd:'DoQuery', data:{ sql:`SELECT DATEDIFF(YEAR, '${ inicio }', '${fin}') AS dateDiff` }});
        const { dateDiff } = DoQuery.outData.pop();
        return dateDiff;
    }
    async function GetVTD(){
        await doCmd({cmd:'GetFullTable', data:{ table:'VTD' }});
        const [ headers, ...tableRows ] = GetFullTable.outData;
        return tableRows.map( row => {
            let record ={};
            headers.forEach((name, index)=> record[name] = Number(row[index]));
            return record;
        })
    }
}

module.exports = cmdVidaSaldada;