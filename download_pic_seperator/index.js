
const path = require('path');
const _ = require("underscore");
const pfs = require('promise-fs');
const ini = require('ini');
const fs = require("fs");
const { assert } = require('console');


const isExist = async (tempPath) => {
    try {
        if (!tempPath) {
            return false;
        }
        const error = await pfs.access(tempPath);
        return !error;
    } catch (e) {
        return false;
    }
};

const mkdir = async function (path, quiet) {
    if (path && !(await isExist(path))) {
        try {
            const err = await pfs.mkdir(path, { recursive: true });
            if (err instanceof Error) {
                throw err;
            }
        } catch (err) {
            if (!quiet) {
                throw err;
            }
        }
    }
}

const imageTypes = [".jpg", ".jpeg", ".gif", ".bmp", ".webp"]; // ".png" is excluded
function escapeDot(arr) {
    return arr.map(e => e.replace(".", "\\."))
}
const imageTypesRegex = new RegExp("(" + escapeDot(imageTypes).join("|") + ")$");
const isImage =  function (fn) {
    return !!fn.toLowerCase().match(imageTypesRegex);
};

//-------------------------------------
//  
//   
//  
//------------------------------------
let rootPath = path.resolve(process.cwd()); 
// let fp = process.argv[2]; //"Y:\\_Photo2\\test-1"
let output_dir_path = path.resolve(rootPath, "sep_output");
const main = async () => {

    const path_config_path = path.join(rootPath, "config-path.ini");
    const fContent1 = fs.readFileSync(path_config_path).toString();
    const path_config = ini.parse(fContent1);
    
    await mkdir(output_dir_path);
    for(let input_path of path_config["input_path"]){
        await handle_one_folder(input_path);
    }
}

async function handle_one_folder(fp){
    let fileNames = await pfs.readdir(fp, {});

    for(let ii = 0; ii < fileNames.length; ii++){
        try{
            const fn = fileNames[ii];
            if(!isImage(fn)){
                continue;
            }

            const tokens = fn.split(" -- ");
            console.assert(tokens.length == 3);

            let author = tokens[1];
            if(author.includes("@")){
                author = author.split("@")[0];
            }
            if(!author){
                continue;
            }
            
            const author_dir_path = path.resolve(output_dir_path, author);
            await mkdir(author_dir_path);

            const tempFp = path.resolve(fp, fn);
            const dest_fp = path.resolve(author_dir_path, fn);
            if(await isExist(dest_fp)){
                await pfs.copyFile(tempFp, dest_fp);
            }
        }catch(e){
            console.error("["+ tempFp + "]", e)
        }finally{
            console.log(`${ii}/${fileNames.length} FROM ${fp}`);
        }
    }
}


main();

