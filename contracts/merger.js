const {merge} = require("sol-merger");
fs = require("fs");

async function start(){
    const code = await merge('LuniverseGluwacoin.sol');
    fs.writeFile("Gluwacoin.sol",code,(err)=>{
        if(err)console.log(err);
    })
}
start();