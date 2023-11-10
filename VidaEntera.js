const { doCmd } = require('./lib')

const cmdVidaSaldada = async context => {
    const {
        fNacimiento = '1981-09-15',
        fInicio     = '2011-01-05',
        fUltimaPrima= '2016-09-30',
        fControl    = '2021-12-31',
        sexo        = 'H',
        capital     = 18576923.0769231,
        S           = 30,
    } = context;
    const edadInicio = (await GetDiffDates(fNacimiento, fInicio)) - 1,
          aniosSal   = await GetDiffDates(fInicio, fUltimaPrima),
          VTD        = await GetVTD();
    
    const MaxVTD = VTD[ VTD.length - 1];
    // Obtener la tabla de mortalidad.
    await doCmd({cmd:'ExeChain', data:{ chain:'cmdGetTablaMortalidad', context:`{sexo:'${ sexo }'}`}});
    const { outData: TablaMortalidad } = ExeChain;
    const XT_limit = edadInicio + TablaMortalidad.length -1;
    const { lx: lxEdad } = TablaMortalidad.find( item => item.x == edadInicio);

    const dataSet = Array.from({ length: XT_limit })
        .map( (_, x) => {
            const xt = edadInicio + x;
            const { lx, dx } = xt > 110 ? { lx: 0, dx: 0 } : TablaMortalidad.find( item => item.x == xt );                

            const t  = x,
                i  = (VTD.find( item => item.Plazo == x) || MaxVTD).EstresEmpirico,
                f3 = Math.pow(1 + i, - t),
                f4 = xt > 110 ? 0 : lx/lxEdad,
                f5 = f3 * f4,
                f6 = xt > 110 ? 0  : Number(dx/lxEdad || 0),
                f7 = Math.pow((1+i), -(t+1)),
                f8 = Number(f6 * f7 || 0);
            return {
                xt,
                t,
                i,
                f3,
                f4, 
                f5,
                f6,
                f7,
                f8,
                lx,
                dx,
            }
        });
    let Px = 0;
    dataSet.forEach( (row, index) => {
        row['f9']  = SumParentChilds({dataset: dataSet, currentIndex: index, propName: 'f8', limit: 0}) || 1;
        const rowSum = (SumParentChilds({ dataset: dataSet, currentIndex: index, propName: 'f5', limit: edadInicio } ) || 1);
        row['f10'] = (edadInicio + row.t) >= (edadInicio + S) ? 0 : rowSum * row.lx /lxEdad * (Math.pow(1 +row.i, row.t));
        if(index == 0)
            Px = row.f9 / row.f10;
        const c1 = (row.f9 - (Px * row.f10));
        row['f11'] = row.t >=S ? row.f9 :  c1 * capital;
    })
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
    function SumParentChilds( {dataset, currentIndex, propName, limit }){
        let total = 0,
            indexLimit = limit == 0 ? dataset.length: limit;
        for(let rowIndex = currentIndex; rowIndex < indexLimit; rowIndex++){
            const item = dataset[rowIndex];
            total += Number(item[propName] || 0);
        }
        return total;
    }
}

module.exports = cmdVidaSaldada;