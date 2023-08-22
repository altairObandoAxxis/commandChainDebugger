const { doCmd } = require('./lib')
const main = async (context) => {
    await doCmd({cmd:'GetPing'});
    await doCmd({cmd:'RepoLifePolicy', data: { operation: 'GET', page: 1, size: 10 }})
}

main({})
.then(output => console.log(output))
.catch(err => console.error(err));