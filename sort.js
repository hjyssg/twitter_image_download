const fs = require("fs");
const path = require('path');

function isExist(path) {
    try{
        const error = fs.accessSync(path);
        return !error;
    }catch(e){
        return false;
    }
};

const folder_path = "C:\\Users\\hjy\\Downloads\\twitter-liked-until-2020-11-04";
const output_path = "C:\\Users\\hjy\\Downloads\\twitter-liked-until-2020-11-04";
let MKDIR_COUNT = 10;


let fnArr = fs.readdirSync(folder_path);

const groupByUser = {};

fnArr.forEach(fileName => {

    //change mtime
    let p = path.join(folder_path, fileName);
    const mstr = fileName.match(/\d{4}-\d{2}-\d{2}/)[0];
    if(mstr){
        let mtime = new Date(mstr);
        fs.utimesSync(p, mtime, mtime);
    }

    //prepare for grouping
    const user =  fileName.split(" -- ")[1];
    if(user.includes("@")){
        groupByUser[user] = groupByUser[user] || [];
        groupByUser[user].push(fileName);
    }
});


for(let user in groupByUser){
    if(groupByUser.hasOwnProperty(user)){
        const imgs = groupByUser[user];

        if(imgs.length >= MKDIR_COUNT){

            try{
                const dest = path.join(output_path, user);
                if(!isExist(dest)){
                    fs.mkdirSync(dest, {recursive: true});
                }

                imgs.forEach(e => {
                    let newP = path.join(dest, e);
                    let oldP = path.join(folder_path, e);
                    fs.renameSync(oldP, newP)
                })

            }catch(e){
                debugger;
                console.error(e);
            }
        }
    }
}


// if(!isExist(dest)){
//      err = fs.mkdirSync(dest, {recursive: true});
// }

// fs.renameSync(oldPath, newPath)
