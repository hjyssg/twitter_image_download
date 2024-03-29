// ==UserScript==
// @name                bilbili: Download All Images
// @name:zh-CN          bilbili：下载全部图片
// @version             0.0.1
// @description         One button click to download all imgs in bilbili page. If Chrome keep popping up the annoying saveAs dialog, go to Chrome setting page and turn it off. Firefox is faster after testing.
// @description:zh-CN   一键下载bilbili页面所有图片。需要注意使用chrome会一直疯狂跳弹窗，需要用户自行去设置页面关闭. firefox批量下载比chrome快。
// @author              aji
// @namespace           https://github.com/hjyssg
// @icon                https://i.imgur.com/M9oO8K9.png
// @include             https://space.bilibili.com/*
// @grant               GM_download
// @grant               GM_setValue
// @grant               GM_getValue
// ==/UserScript==

/* jshint esversion: 6 */

//https://stackoverflow.com/questions/6480082/add-a-javascript-button-using-greasemonkey-or-tampermonkey
function addButton(text, onclick, cssObj, id) {
    const defaultCSS = {position: 'fixed', top: '7%', left:'50%', 'z-index': 3,
                        "background-color": "#57cff7", "color": "white",
                        "padding": "10px", "border": "0px",
                        "font-size": "1rem","font-weight": "bold" }
    cssObj = Object.assign(defaultCSS, cssObj || {} )
    let button = document.createElement('button'), btnStyle = button.style;
    document.body.appendChild(button)
    button.innerHTML = text;
    button.onclick = onclick
    btnStyle.position = 'fixed';
    button.id = id;
    Object.keys(cssObj).forEach(key => btnStyle[key] = cssObj[key]);
    return button;
}

function sleep(ms) {
   return new Promise(resolve => setTimeout(resolve, ms));
}

let downloadedLink = GM_getValue("downloadedLink") || {};

// function formatDate(date) {
//     var d = new Date(date),
//         month = '' + (d.getMonth() + 1),
//         day = '' + d.getDate(),
//         year = d.getFullYear();

//     if (month.length < 2)
//         month = '0' + month;
//     if (day.length < 2)
//         day = '0' + day;

//     return [year, month, day].join('-');
// }


function removeQueryString(url) {
  // 使用'@'分割URL，并取分割后的第一部分
  const result = url.split('@')[0];
  return result;
}

function getLastSegmentOfUrl(url) {
  // 使用'/'分割URL，并获取数组的最后一个元素
  const segments = url.split('/');
  const lastSegment = segments.pop(); // 获取并移除数组的最后一个元素
  return lastSegment;
}

async function findImgAndDownload(){
    let queue = [];
    document.querySelectorAll(".bili-dyn-list__item .bili-dyn-item__body").forEach(article => {
        const imgs =  Array.from(article.querySelectorAll(".bili-album__preview__picture img"));
        if(imgs.length > 1) {
          imgs.forEach(img => {
            if(img.clientWidth < 80 && img.clientHeight < 80){
              //skip icon and emoji
              return;
            }

            const link = removeQueryString(img.src);
            queue.push({
              // author,
              link,
            });
          });
        }
      })


    let downloadNumInOneScroll = 0;

    for(let ii = 0; ii < queue.length; ii++){
        const info = queue[ii];
        let { link } = info;
        if(_stop_download_){
            break;
        }

        if(downloadedLink[link]){
            continue;
        }

        let _link =  link;;
        let segment;
        const url = new URL(link);
        let format;


        const fn = getLastSegmentOfUrl(_link).trim();
        const _log = ()=>{
            if(download_count === 0){
                download_time_beg = new Date();
            }

            download_count++;
            downloadNumInOneScroll++;
            let download_time_middle = new Date();
            const spd = (download_time_middle.getTime() - download_time_beg.getTime())/download_count/1000;
            console.log(download_count, "imgs downloaded.   ", spd, "second/img");
        }

        try{

            await GM_downloadPromise(_link, fn);
            _log();
            downloadedLink[link] = true;
            await sleep(100);
        }catch(err){
            try{
                await sleep(2000);
                await GM_downloadPromise(_link, fn);
                downloadedLink[link] = true;
                _log();
                await sleep(1000);
            } catch(err2){
                console.error("[error]", _link, err2);
            }
          // console.error(err)
          // debugger
        }
    }

    return downloadNumInOneScroll;
}

function GM_downloadPromise(_link, fn){
  return new Promise((resolve, reject) => {
    GM_download({
            url: _link,
            name: fn,
            saveAs: false,  // this do not work for Chrome
            onerror: err => {
                reject(err);
            },
            ontimeout: ()=>{
                reject("timeout");
            },
            onload: ()=>{
               resolve();
            }
    });
  })
}

let _stop_download_;
let download_count;
let download_time_beg;
async function beginDownloadAndScroll(){
    _stop_download_ = false;
    let scrollReachEndCount = 0;
    download_count = 0;

    console.log("begin", new Date());
    while(!_stop_download_ && scrollReachEndCount < 60){
        const downloadNumInOneScroll = await findImgAndDownload();

        if(downloadNumInOneScroll === 0){
            const newY = window.scrollY + 1000;
            window.scrollTo(0, newY);
            await sleep(100);
        }else{
            const newY = window.scrollY + 500;
            window.scrollTo(0, newY);
            await sleep(500);
        }

        GM_setValue("downloadedLink", downloadedLink);
    }
    console.log("download stop");
}


(async function() {
    'use strict';


    addButton("download all images", beginDownloadAndScroll, {top: '7%'}, "a-begin-button");

    addButton("stop download", () => {
        _stop_download_ = true;
        console.log("going to stop...");
    }, {top: '12%'}, "a-stop-button");
})();
