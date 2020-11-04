// ==UserScript==
// @name                Twitter: Download All Images
// @name:zh-CN          Twitter：下载全部图片
// @version             0.0.1
// @description         One button click to download all imgs in twitter page. Firefox is recommended for this script. Chrome will keep popping up the annoying saveAs dialog.
// @description:zh-CN   一键下载twitter页面所有图片。需要注意使用chrome会一直疯狂跳弹窗，建议使用firefox.
// @author              aji
// @namespace           https://github.com/hjyssg
// @icon                https://i.imgur.com/M9oO8K9.png
// @include             https://twitter.com/*
// @include             https://mobile.twitter.com/*
// @grant               GM_download
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

const downloadedLink = {}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

async function findImgAndDownload(){
    let queue = [];
    document.querySelectorAll("article").forEach(article => {
        //e.g 水洗卜イレ@suisentoire· asdsad
        let spans = Array.from(article.querySelectorAll("span span"));
        let author;
        let timestamp;

        for(let ii = 0; ii < spans.length; ii++){
          let e1 = spans[ii];
          let e2 = e1.parentElement.parentElement.parentElement.parentElement;
          if(e2.textContent.includes("@")){
            author = e2.textContent;
            break;
          }
        }
        if(!author){
          return;
        }

        let timeSpan = article.querySelector("article time");
        if(timeSpan){
            let dt = new Date(timeSpan.getAttribute("datetime"));
            timestamp = formatDate(dt);
        }
   
        // console.log(author);  
        const imgs = article.querySelectorAll("img");
        if(imgs.length > 1) {
          imgs.forEach(img => {
            if(img.clientWidth < 80 && img.clientHeight < 80){
              //skip icon and emoji
              return;
            }

            const link = img.src;
            queue.push({
              author,
              link,
              timestamp
            });
          });
        }
      })

    // queue = queue.filter(e => !downloadedLink[e.link]);

    for(let ii = 0; ii < queue.length; ii++){
        const info = queue[ii];
        const { link, author, timestamp } = info;

        if(_stop_download_){
            break;
        }

        if(downloadedLink[link]){
            continue;
        }

        const url = new URL(link);
        let format;
        if(url.search){
            if(url.searchParams.get("name")){
                url.searchParams.set("name", "orig")
            }

            format = url.searchParams.get("format")
        }  
        // else{
        //          // http://fridge-dweller.blogspot.com/2012/09/obtaining-tweeted-images-in-original.html
        //          url.href += ":orig";
        // }

        let _link = url.href;
        const segment = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
        let fn = author +" -- " + timestamp||"" + " " + segment;

        if(format){
            fn = fn + "." + format;
        }

        fn = fn.trim();
         
        try{
          // console.log("begin download", _link)
          downloadedLink[link] = true;
          await GM_downloadPromise(_link, fn);
          // console.log("downloaded", _link);
          console.log(Object.keys(downloadedLink).length, "imgs downloaded")
          await sleep(100);
        }catch(err){
          // console.error(err)
          debugger
        }
    }
}

function GM_downloadPromise(_link, fn){
  return new Promise((resolve, reject) => {
    GM_download({
            url: _link, 
            name: fn,
            saveAs: false,  // this do not work for Chrome
            onerror: err => {
                console.error("error", _link);
                reject(err);
            },
            ontimeout: ()=>{
                console.error("timeout", _link);
                reject("timeout");
            },
            onload: ()=>{
               resolve();
            }
    });
  })
}

let _stop_download_;

async function beginDownloadAndScroll(){
    _stop_download_ = false;
    let scrollReachEndCount = 0;

    while(!_stop_download_ && scrollReachEndCount < 30){
        await findImgAndDownload();
        const newY = window.scrollY + 500;
        window.scrollTo(0, newY);
        await sleep(200);
           
        if(window.scrollY < newY){
            //not scroll as much as expected
            //meaning reaching the end
            scrollReachEndCount++;
        }else{
            //use count here
            //be very careful here, I want to download all imgs
            scrollReachEndCount = 0;
        }
    }
    
    console.log("download stop");
}


(function() {
    'use strict';
    addButton("download all images", beginDownloadAndScroll, {top: '7%'}, "a-begin-button");

    addButton("stop download", () => { 
        _stop_download_ = true;
    }, {top: '12%'}, "a-stop-button");
})();
