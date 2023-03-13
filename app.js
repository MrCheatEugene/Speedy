/*
SPEEDY WebServer 1.0.

Код распостраняется по лицензии The Unlicense.

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>

-------

Автор: Эмиль Хайруллин
GitHub: https://github.com/MrCheatEugene/Speedy
GitFlic: https://gitflic.ru/project/emil/speedy
Локальный git-сервер: http://188.120.239.206:3000/mrcheat/Speedy
*/
const {host,ssl_key,ssl_cert,port} = require('./config.json');
const http = require('https');
const fs = require('fs');
const tls = require('tls');
const mime = require('mime-types');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var currvhosts = ['localhost','localhot']
function read(path) {
  try{
    const fileContent = fs.readFileSync(path);
    const array = JSON.parse(fileContent);
    return array;
  }catch(e){
    console.log("[READ] Failed to parse file "+path+"! Error: \n"+e)
    return "";
  }
}
function readHTML(path) {
  try{
    const fileContent = fs.readFileSync(path);
    const array = (fileContent);
    return array;
  }catch(e){
    console.log("[READ] Failed to read file "+path+"! Error: \n"+e)
    return false;
  }
}
//let port="443";
let html='';

(function (){
async function listenSRV(port,host,my_ssl_cert,my_ssl_key){
  const options = {
  key: fs.readFileSync(my_ssl_key),
  cert: fs.readFileSync(my_ssl_cert),
  ciphers: [
        "ECDHE-RSA-AES128-SHA256",
        "DHE-RSA-AES128-SHA256",
        "AES128-GCM-SHA256",
        "RC4",
        "HIGH",
        "!MD5",
        "!aNULL"
    ].join(':') 
};

var count = 0;
function getWWWByHostname(hostname){
  if(currvhosts.hasOwnProperty(hostname)){
    var vhost = currvhosts[hostname];
    return vhost['www'];
  }
  return false;
}

function getForbiddenByHostname(hostname){
  if(currvhosts.hasOwnProperty(hostname)){
    var vhost = currvhosts[hostname];
    return vhost['forbidden'];
  }
  return "./forbidden";
}

function actuallyProcessHtml(html,host,mimetype){
  // вот здесь можно обработать html как вам угодно
  return html;
}
var haveSetUpdater = {};
var preprocessedHtml = {}
function savepreprocessedhtml(host,file,contents){
  console.log("[savepreprocessedhtml] Saving preprocessed HTML ("+host+"@"+file+")");
  if(!preprocessedHtml.hasOwnProperty(host)){
    preprocessedHtml[host] = {}
  }
  preprocessedHtml[host][file] = contents;
  console.log("[savepreprocessedhtml] Saved.")
}
function processHtml(html,host,mimetype,file){
  if(!haveSetUpdater.hasOwnProperty(host)){
    haveSetUpdater[host] = {}
  }
  if(!haveSetUpdater[host].hasOwnProperty(file)){
    haveSetUpdater[host][file] = false;
  }
  if(!haveSetUpdater[host][file]){
    console.log("[processHtml] Updater is not set, setting it and returning processed html");
    haveSetUpdater[host][file] = true;
    setInterval(function(){savepreprocessedhtml(host,file,actuallyProcessHtml(html,host,mimetype))},30000);
    let myhtml = actuallyProcessHtml(html,host,mimetype);
    savepreprocessedhtml(host,file,myhtml);
    return myhtml;
  }else{;
    if (preprocessedHtml.hasOwnProperty(host) && preprocessedHtml[host].hasOwnProperty(file)) {
      return preprocessedHtml[host][file];
    }
  }
  return "File not found.";
}
function getOptionsByHostname(hostname){
  if(currvhosts.hasOwnProperty(hostname)){
    var vhost = currvhosts[hostname];
    return {
      key: fs.readFileSync(vhost['ssl_key']),
      cert: fs.readFileSync(vhost['ssl_cert']),
      ciphers: [
          "ECDHE-RSA-AES128-SHA256",
          "DHE-RSA-AES128-SHA256",
          "AES128-GCM-SHA256",
          "RC4",
          "HIGH",
          "!MD5",
          "!aNULL"
        ].join(':') 
      };
  }
  return options;
}
var httpsCerts=[]
var httpsOptions = {
    SNICallback: function(hostname, cb) {
      console.log("[SNICallback] Request from hostname "+hostname+"!")
      var ctx = tls.createSecureContext(getOptionsByHostname(hostname))
      cb(null, ctx)
    }
}

function replaceAll(string,find,toReplace){
  let mystring = string;
  while(mystring.indexOf(find)>-1){ 
    mystring = mystring.replace(find,toReplace);
  }
return mystring;
}

const server = http.createServer(httpsOptions,(req, res) => {

let ecode=200;
let uurl;
let mimetype= mime.lookup("."+req.url);
uurl = req.url;
var host = ""
if (req.headers.hasOwnProperty('host') || req.headers.hasOwnProperty('Host')) {
  host = req.headers['host'];
}

if (currvhosts.hasOwnProperty(host) == false) {
  console.log("[Webserver] New request: (VHostname "+host+") "+req.method+" "+req.url+"("+ecode+", "+mimetype+") by "+req.socket.localAddress+":"+req.socket.localPort);
  host = "";
 try{
  res.writeHead(404, { 'Content-Type': 'text/plain','server':'Speedy'});
  res.end("File not found. Count: "+count); 
 }catch(e){
   console.log("[Webserver] Error: "+e);
 }
}else{
let isforb;
let www = getWWWByHostname(host);
if(www == false){
   console.log("[Webserver] Error. Failed to get root directory for domain "+host)
   ;
   host = "";
 try{
  res.writeHead(404, { 'Content-Type': 'text/plain','server':'Speedy'});
  res.end("File not found. Count: "+count); 
 }catch(e){
   console.log("[Webserver] Error: "+e);
 }
}
let forb = read(getForbiddenByHostname(host));
isforb=forb.includes(req.url);
  if(isforb == true){
    ecode=403;
console.log("[Webserver] Rejecting request(Forbidden URL): (VHostname "+host+") "+req.method+" "+req.url+"("+ecode+") by "+req.socket.localAddress+":"+req.socket.localPort);
    html="<h1>Forbidden</h1><br><img src=\"https://http.cat/403.jpg\">";
    try{
    res.writeHead(ecode, { 'Content-Type': 'text/html','server':'Speedy'});
    res.end(html);  
    }catch(e){
      console.log("[Webserver] Error: "+e);
    }
  }else{
if(host!==""){
if(mimetype == false){
	mimetype="text/html";
}
	if (uurl == "/"){ uurl="/index.html";}else{
			 uurl = req.url;
	}
let fsres;
		try {
 fsres = readHTML(www+uurl);
 if (fsres===false) {
  ecode = 404;
  html='Not found<br><img src="//http.cat/404.jpg" />';
  fsres=0;
  console.log("[Webserver] Error opening "+uurl+"!");
 }else{
 ecode=200;   html =fsres;
	fsres=0;
}
} catch (err) {
  mimetype = 'text/html';   
  ecode=500; html='Internal server error<br><img src="//http.cat/500.jpg" />'; 	fsres=0;
  console.log("[Webserver] Error opening "+uurl+"! "+err);
}
 try{
    if(mimetype == 'text/html'){
      html = processHtml(html,host,mimetype,uurl);
    }
    res.writeHead(ecode, { 'Content-Type': mimetype,'server':'Speedy'});
    res.end(html);  
  }catch(e){
    console.log("[Webserver] Error: "+e);
  }
console.log("[Webserver] New request: (VHostname "+host+") "+req.method+" "+req.url+"("+ecode+", "+mimetype+") by "+req.socket.localAddress+":"+req.socket.localPort);
}
}
}
}).listen(port,host);
console.log("[Webserver] Listening on port "+port+", host "+host);
//});
// set data
}
async function updateVHosts() {
  console.log("[VHosts] Updating VHosts...")
  let myvhosts = read('./VHosts.json');
  currvhosts = myvhosts;
  console.log("[VHosts] Success");
}
async function updateVHostsTimer() {
  setInterval(function(){updateVHosts()},10000)
}
updateVHosts();
listenSRV(port,host,ssl_cert,ssl_key);
updateVHostsTimer();
})();