var http = require('http');
var fs = require('fs');
var path = require('path');

http.createServer(function (request, response) {
    // [Get("/eth-contracts/raw/master/deployed/{networkName}/VERSION")]
    // Task<string> GetLatestVersion(string networkName);

    // [Get("/eth-contracts/raw/master/deployed/{networkName}/{versionString}/{contractName}.json")]
    // Task<string> GetAbiForVersionAndContract(string networkName, string versionString, string contractName);

    // [Get("/eth-contracts/raw/master/deployed/{networkName}/{versionString}/manifest.json")]
    
    console.log("Requesting " + request.url);
    var network = request.url.match(/eth-contracts\/raw\/master\/deployed\/([^\/]*)\//);
    var version = request.url.match(/eth-contracts\/raw\/master\/deployed\/([^\/]*)\/([^\/]*)\//);

    try { network = network[1]; } 
    catch (e) { network = null; }

    try { version = version[2]; } 
    catch (e) { version = null; }

    console.log("NETWORK: ", network);
    console.log("VERSION: ", version);
    console.log("BASENAME: ", path.basename(request.url));
    
    filePath = './deployed/' + network + '/';

    if (version != null)
        filePath = filePath + version + '/';

    filePath = filePath + path.basename(request.url);

    contentType = 'application/json';
    
    console.log("Attempting to load " + filePath);
    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(8125);
console.log('Server running at http://0.0.0.0:8125/');
