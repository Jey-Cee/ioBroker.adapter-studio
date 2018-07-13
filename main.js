'use strict';

// you have to require the utils module and call adapter function
const utils =    require(__dirname + '/lib/utils'); // Get common adapter utils
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const os = require('os');
const fs = require('fs');
const request = require('request');

let plattform = os.platform();


// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.adapter_studio.0
const adapter = new utils.Adapter('adapter-studio');

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', (callback) => {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', (id, obj) => {
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

// is called if a subscribed state changes
adapter.on('stateChange', (id, state) => {
    // Warning, state can be null if it was deleted
    adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        adapter.log.info('ack is not set!');
    }
});

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', (obj) => {
    adapter.log.info(JSON.stringify(obj));
    if (typeof obj === 'object' && obj.message) {

        if (obj.command === 'send') {
            // e.g. send email or pushover or whatever
            //adapter.log.debug('send command');

            // Send response in callback if required
            //if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
            if(obj.message === 'getAdapterList'){
                getAdapters((res) => {
                    //adapter.log.info(`Callback ${res}`);
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                })
            }

            if(obj.message.command === 'getAdapterFiles'){
                getAdapterFiles(obj.message.folder, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'openFile'){
                openFile(obj.message.file, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'saveFile'){
                saveFile(obj.message.file, obj.message.data, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'uploadFiles'){
                uploadFiles(obj.message.adapterName, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'ssAdapter'){
                ssAdapter(obj.message.adapterName, obj.message.cmd, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'createAdapter'){
                createAdapter(obj.message, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'getRunningState'){
                getRunningState(obj.message.adapterName, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'npmPublish'){
                npmPublish(obj.message.adapterName, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'npmAddUser'){
                npmAdduser(obj.message.user, obj.message.password, obj.message.email, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'checkoutGithub'){
                checkoutGithub(obj.message.link, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }

            if(obj.message.command === 'githubPublish'){
                createNewGHRepo(obj.message.adapterName, (res) => {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }
        }

    }





});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', () => {
    main();
});

function main() {
    adapter.log.info(plattform);
    adapter.log.info(__dirname);
    createNewGHRepo('test', ()=>{});
}

let ready = true;
let s;
switch(plattform){
    case 'win32':
        s = '\\';
        break;
    case 'linux':
        s = '/';
        break;
}

function createAdapter(data, callback){
    //adapter.log.info(JSON.stringify(data));

    let newName = data.name;
    newName = newName.replace(' ', '-');
    newName = newName.toLowerCase();

    let odir = __dirname;
    let path = odir.replace('iobroker.adapter-studio', `iobroker.${newName}`);

    let remove = ['.git'];
    let addFiles = [];
    let newFile = [];



    if(data.widgets === false){
        remove.push('widgets')
    }
    if(data.webpage === false){
        remove.push('www')
    }
    if(data.adminv2 === false){
        remove.push(`admin${s}index.html`);
    }
    if(data.license !== 'MIT'){
        let folder = `${s}licenses${s}`;

        remove.push('LICENSE');
        switch(data.license){
            case 'Apache 2.0':
                addFiles.push(`${folder}Apache_2.0`);
                break;
            case 'CC-BY':
                addFiles.push(`${folder}CC-BY`);
                break;
            case 'CC-BY-NC':
                addFiles.push(`${folder}CC-BY-NC`);
                break;
            case 'CC-BY-NC-SA':
                addFiles.push(`${folder}CC-BY-NC-SA`);
                break;
            case 'OFL-1.1':
                addFiles.push(`${folder}OFL_1.1`);
                break;
            case 'EPL':
                addFiles.push(`${folder}EPL`);
                break;
            case 'LGPL':
                addFiles.push(`${folder}LGPL_v3`);
                break;
            case 'GPLv3':
                addFiles.push(`${folder}GPLv3`);
                break;
            case 'GPLv2':
                addFiles.push(`${folder}GPLv2`);
                break;
        }
        newFile.push('LICENSE');
    }

    if(data.adminv2 === true){
        addFiles.push('tab.html');
        newFile.push(`admin${s}tab.html`);
    }
    if(data.tab === true){
        addFiles.push('tab_m.html');
        addFiles.push('tab.js');
        newFile.push(`admin${s}tab_m.html`);
        newFile.push(`admin${s}tab.js`);
    }

    let gclone = `git clone --depth=1 https://github.com/ioBroker/ioBroker.template.git ${path}`;

    let child = exec(gclone);

    child.stderr.pipe(process.stdout);
    child.on('exit', () => {
        //if (callback) callback(adapter);

        for(let i = 0; i <= remove.length -1; i++){

            let rm = new RemoveFaF(remove[i], path);

        }

        for(let i = 0; i <= addFiles.length -1; i++){

            let rm = new AddTFiles(addFiles[i], path, newFile[i]);

        }

        fs.readFile(`${path}${s}io-package.json`, (err, output) => {
            let json = JSON.parse(output);
            if (err) throw err;
            if(data.mode.toLowerCase() === 'schedule'){
                json.common.schedule = data.cron
            }
            json.common.mode = data.mode.toLowerCase();
            json.common.license = data.license;
            json.common.enabled = data.enabled;
            json.common.loglevel = data.logLevel;
            json.common.type = data.type;
            json.common.messagebox = data.messagebox;
            if(data.tab === true){
                json.common.materialize = true;
                json.common.adminTab =  {"name": newName};
            }
            //Keywords
            let keywords = data.keywords;
            keywords = keywords.split(', ');

            json.common.keywords = keywords;

            json.common.version = '0.0.1';
            json.common.news = {"0.0.1": { "en": "initial version created with Adapter-Studio by Jey Cee", "de": "erste Version erstellt mit Adapter-Studio von Jey Cee", "ru": "начальная версия, созданная с помощью Adapter-Studio by Jey Cee", "pt": "versão inicial criada com o Adapter-Studio por Jey Cee", "nl": "eerste versie gemaakt met Adapter-Studio door Jey Cee", "fr": "Version initiale créée avec Adapter-Studio par Jey Cee", "it": "versione iniziale creata con Adapter-Studio di Jey Cee", "es": "versión inicial creada con Adapter-Studio por Jey Cee", "pl": "początkowa wersja stworzona za pomocą Adapter-Studio przez Jey Cee"}};

            if(data.widgets === true){
                json.restartAdapters = ["vis"];
            }

            //Adapter dependencies
            if(data.depAdapters.length === 0){

            }else {
                let adapters = data.depAdapters;
                adapters = adapters.split(', ');


                let arr = {};

                for (let i in adapters) {
                    let x = adapters[i].split(' ');
                    arr[x[0]] = `${x[1]}`;
                }

                //let jsonArr = `"dependencies": [${arr}]`;
                json.common.dependencies = arr;
            }

            fs.writeFile(`${path}${s}io-package.json`, JSON.stringify(json, null, 4), (err) => {
                if (err) throw err;
                adapter.log.info('The file io-package.json has been saved!');
            });

        });

        fs.readFile(`${path}${s}package.json`, (err, output) => {
            let json = JSON.parse(output);
            if (err) throw err;
            json.license = data.license;
            json.version = '0.0.1';

            //Keywords
            let keywords = data.keywords;
            keywords = keywords.split(', ');

            json.keywords = keywords;

            //dependencies

            if(data.dependencies.length > 0){
                let dependencies = data.dependencies;
                dependencies = dependencies.split(', ');


                let arr = {};

                for(let i in dependencies){
                    let x = dependencies[i].split(' ');
                    arr[x[0]] = `${x[1]}`;
                }
                if(arr.length === 0){
                    json.dependencies = '';
                }else{
                    json.dependencies = arr;
                }
            }

            json.scripts = {"gulp": "gulp"};


            fs.writeFile(`${path}${s}package.json`, JSON.stringify(json, null, 4), (err) => {
                let email = data.email;
                let author = data.author;
                adapter.log.info(`rename information: ${email}, ${author}`);
                if (err) throw err;
                adapter.log.info('The file package.json has been saved!');
                installDependencies(path, (data)=>{
                    if(data === 'Error'){
                        callback('Error');
                    }else{
                        adapter.log.info(`rename information: ${email}, ${author}`);
                        rename(path, newName, email, author, () => {
                            let cmd = 'git add .';
                            const child = exec(cmd, {cwd: path});
                            child.stderr.pipe(process.stdout);
                            child.on('exit', (code) => {
                                if(code === 0){
                                    callback('Error')
                                }else{
                                    callback('Done')
                                }

                                child.stderr.on('data',(data) => {
                                    adapter.log.info('stderr: ' + data.toString());
                                });
                                child.stdout.on('data',(data) => {
                                    adapter.log.info('stdout: ' + data.toString());
                                });

                            });
                        });
                    }

                });


            });

        });
    });
}



function RemoveFaF(name, path){
    ready = false;
    let cmd;

    switch(plattform){
        case 'win32':
            cmd = `del /Q /S /F ${name} & rd /S /Q ${name}`;
            break;
        case 'linux':
            cmd = `rm -r ${name}`;
            break;
    }

    const child = exec(cmd, {cwd: path});
    child.stderr.pipe(process.stdout);
    child.on('exit', () => {


    });

}

function AddTFiles(file, path, newFile){
    ready = false;
    let cmd;

    switch(plattform){
        case 'win32':
            cmd = `copy ${__dirname}\\templates\\${file} ${newFile}`;
            break;
        case 'linux':
            cmd = `mv ${__dirname}/templates/${file} ${newFile}`;
            break;
    }
    const child = exec(cmd, {cwd: path});
    child.stderr.pipe(process.stdout);
    child.on('exit', () => {
    });
}

function cacheClean(path, callback){
    let cmd = `npm cache clean --force`;
    const child = exec(cmd, {cwd: path});

    child.stderr.pipe(process.stdout);
    child.on('exit', (code) => {
        adapter.log.info(`Exit code cache clean: ${code}`);
        callback('Done')
    });
}
function installDependencies(path, callback){
    cacheClean(path, (result)=>{
        if(result === 'Done'){
            let cmd = `npm install`;
            const child = exec(cmd, {cwd: path});

            child.stderr.pipe(process.stdout);
            child.on('exit', (code) => {
                adapter.log.info(`Exit code install dependencies: ${code}`);
                if(code === 0){
                    let cmd = `npm install --only=dev`;
                    const child = exec(cmd, {cwd: path});

                    child.stderr.pipe(process.stdout);
                    child.on('exit', (code) => {
                        adapter.log.info(`Exit code install dev dependencies: ${code}`);
                        if(code === 0){
                            callback('Done');
                        }else{
                            callback('Error');
                        }
                    });
                }else{
                    callback('Error');
                }
            });
        }
    })

}

function rename(path, name, email, author, callback){
    let cmd = `npm install --global gulp-cli`;
    const child = exec(cmd, {cwd: path});

    child.stderr.pipe(process.stdout);
    child.on('exit', (code) => {

        let cmd = `npm run gulp -- rename --name ${name} --email ${email} --author "${author}"`;
        const child = exec(cmd, {cwd: path});

        child.stderr.pipe(process.stdout);
        child.on('exit', (code) => {
            if (code !== 0) {
                callback('Error');
            } else {
                callback('Done');
            }
        });
        child.stderr.on('data',(data) => {
            adapter.log.info('stderr: ' + data.toString());
        });
        child.stdout.on('data',(data) => {
            adapter.log.info('stdout: ' + data.toString());
        });
    });
    child.stderr.on('data',(data) => {
        adapter.log.info('stderr: ' + data.toString());
    });
    child.stdout.on('data',(data) => {
        adapter.log.info('stdout: ' + data.toString());
    });
}

function getAdapters(callback){
    //adapter.log.debug('Get list of adapters');
    let odir =  __dirname;
    let node_modules = odir.replace('iobroker.adapter-studio', ``);

    fs.readdir(node_modules,(err, files) =>{
        let arrA = [];
        for(let x in files){
            const patt = new RegExp(/io(b|B)roker..*/g);
            const patt2 = new RegExp(/.rar$/g);
            let name = files[x].match(patt);
            if(name !== null){
                let nA = name[0].match(patt2);
                if(nA === null) {
                    arrA.push(name[0]);
                }
            }
        }
        callback(arrA);
    })
}

function getAdapterFiles(name, callback){

    let odir =  __dirname;
    let folder;
    const patt = new RegExp(/.io(b|B)roker\.\w*.\w*.\w*/g);
    let test = name.match(patt);

    if(test !== null){
        if(plattform === 'win32'){
            let patt2 = new RegExp('/', 'g');
            name = name.replace(patt2, s);
        }
        folder = name;
    }else{
        folder = odir.replace('iobroker.adapter-studio', `${s}${name}`);
    }

    fs.readdir(folder,(err, files) => {
        if(err){adapter.log.error(err)}

        let arrA = {};
        for (let x in files) {
            if(fs.lstatSync(`${folder}${s}${files[x]}`).isDirectory()){
                arrA[x] = {"name": files[x], "type": "folder", "parent": folder};
            }else{
                arrA[x]= {"name": files[x], "type": "file", "parent": folder};
            }
        }
        adapter.log.info('Read files');
        callback(arrA);
    });
}

function openFile(file, callback){
    adapter.log.info('open file');
    if(plattform === 'win32'){
        let patt2 = new RegExp('/', 'g');
        file = file.replace(patt2, s);
    }
    const patt = new RegExp('.png');
    let res = patt.test(file);

    fs.readFile(file, (err, output) => {
        if(err){adapter.log.error(err)};
        //adapter.log.debug(output);
        if(!res){
            callback(output)
        }else{
            let Buffer = require('buffer').Buffer;
            let picture = Buffer.from(output).toString('base64');
            callback(picture);
        }

    })
}

function saveFile(file, data, callback){
    if(plattform === 'win32'){
        let patt2 = new RegExp('/', 'g');
        file = file.replace(patt2, s);
    }

    fs.writeFile(file, data, (err, output) => {
        if (err) throw err;
        adapter.log.info(`The file ${file} has been saved!`);
        callback('Done');
    })
}

function uploadFiles(adapterName, callback){

    let odir =  __dirname;

    let baseDir = odir.match(/.*io(b|B)roker(\/|\\)/);
    //baseDir = JSON.stringify(baseDir[0]);

    exec(`iobroker upload ${adapterName}`, {cwd: baseDir[0]}, (error, stderr, stdout) => {
        //adapter.log.info('stdout: ' + stdout);
        //adapter.log.info('stderr: ' + stderr);
        if (error !== null) {
            adapter.log.error('exec error: ' + error);
        }
        callback('Done');
    });
}

function ssAdapter(adapterName, cmd, callback){

    let odir =  __dirname;

    let baseDir = odir.match(/.*io(b|B)roker(\/|\\)/);
    //baseDir = JSON.stringify(baseDir[0]);

    exec(`iobroker ${cmd} ${adapterName}`, {cwd: baseDir[0]}, (error, stderr, stdout) => {
        //adapter.log.info('stdout: ' + stdout);
        //adapter.log.info('stderr: ' + stderr);
        if (error !== null) {
            adapter.log.error('exec error: ' + error);
        }else {
            const patt = new RegExp(/Adapter .* (started|stopped|restarted)./gm);
            if (patt.test(stderr)) {
                callback('Done');
            } else if (patt.test(stdout)) {
                callback('Done');
            } else {
                ssAdapter(adapterName, 'restart', callback);
            }
        }

    });
}

function getRunningState(adapterName, callback){
    adapter.getForeignState(`system.adapter.${adapterName}.0.alive`, (err, state) => {
        adapter.log.info(JSON.stringify(state));
        if(err){
            callback('Error')
        }else if(state === null){
            callback('false')
        }else if(state !== null && state !== undefined){
            callback(state.val)
        }

    })
}

function npmPublish(adapterName, callback){
    let odir = __dirname;
    let path = odir.replace('iobroker.adapter-studio', `${adapterName}`);

    let cmd = `npm publish`;
    const child = exec(cmd, {cwd: path});

    child.stderr.pipe(process.stdout);
    child.on('exit', (code) => {
        adapter.log.info(`Exit code npmPublish: ${code}`);
        if(code === 4294963248){
            callback('Login required')
        }else if(code === 0){
            callback('Done');
        }else if(code > 0){
            callback('Error')
        }
    });
    child.stderr.on('data',(data) => {
        adapter.log.info('stderr: ' + data.toString());
    });
    child.stdout.on('data',(data) => {
        adapter.log.info('stdout: ' + data.toString());
    });
}

function npmAdduser(user, password, email, callback){
    let odir = __dirname;
            let cmd = `npm adduser`;
            const child = exec(cmd, {cwd: odir});

            child.stderr.pipe(process.stdout);
            child.on('exit', (code) => {
                adapter.log.info(`Exit code npmPublish: ${code}`);
                if (code === 0) {
                    callback('Done');
                } else if (code > 0) {
                    callback('Error')
                }
            });

            child.stdin.write(user + '\n' + password + '\n' +email + '\n');
            //child.stdin.write(password + '\n');
            //child.stdin.write(email + '\n');



            child.stderr.on('data', (data) => {
                adapter.log.info('stderr: ' + data.toString());
            });
            child.stdout.on('data', (data) => {
                adapter.log.info('stdout: ' + data.toString());
                switch(data.toString().trim()){
                    case 'Username:':
                        child.stdin.write(user + '\n');
                        break;
                    case 'Password:':
                        child.stdin.write(password + '\n');
                        break;
                    case 'Email: (this IS public)':
                        child.stdin.write(email + '\n');
                        break;
                }

            });

            //child.stdin.end();
}


function createNewGHRepo(adapterName, callback){
    let user = adapter.config.ghuser;
    let pw = adapter.config.ghpw;

    let options = {
        url: `https://api.github.com/user/repos`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': `${user}`,
            'Authorization': 'Basic ' + new Buffer(user + ':' + pw).toString('base64')
        }
    };

    let req = request(options, function (error, res, body){
        adapter.log.info('STATUS: ' + res.statusCode);
        if(res.statusCode === 403){
            callback('Forbidden');
        }else if(res.statusCode === 200){
            let b = JSON.parse(body);
            adapter.log.info(JSON.stringify(b));
            callback('Done');
        }
    });

    let content = `{"name": adapterName, "has_wiki": false, "auto_init": false}`;

    req.write(content);

}

function checkoutGithub(link, callback){
    let odir = __dirname;
    let path = odir.replace(`${s}iobroker.adapter-studio`, ``);

    let cmd = `git clone ${link}`;
    const child = exec(cmd, {cwd: path});

    child.stderr.pipe(process.stdout);
    child.on('exit', (code) => {
        adapter.log.info(`Exit code checkoutGithub: ${code}`);
        if (code === 0) {
            callback('Done');
        } else if (code > 0) {
            callback('Error')
        }
    });

    child.stderr.on('data', (data) => {
        adapter.log.info('stderr: ' + data.toString());
    });
    child.stdout.on('data', (data) => {
        adapter.log.info('stdout: ' + data.toString());
    });

}
