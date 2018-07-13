let actualAdapter;

function Core(main) {
    $('.modal').modal();
    $('.dropdown-trigger').dropdown();
    $('.tabs').tabs();
    $('select').formSelect();
    $('.tooltipped').tooltip();



    $('#btnCreate').click(() => {
        createAdapter();
    });

    $('#ddExpert').click(() => {
        let ddIcon = $('#ddIcon').text();
        if(ddIcon == 'arrow_drop_down'){
            $('#expert-settings').removeClass('hide');
            $('#ddIcon').text('arrow_drop_up');
        }else{
            $('#expert-settings').addClass('hide');
            $('#ddIcon').text('arrow_drop_down');
        }

    });

    $('#sMode').change((obj) => {
        console.log(obj.target.value);
        if(obj.target.value === 'schedule'){
            $('#cron-input').removeClass('hide');
        }else{
            $('#cron-input').addClass('hide');
        }
    });


    $('#liEditor').click(() => {
        $('#chooseAdapter').empty();
        main.socket.emit('sendTo', 'adapter-studio.0', 'send', 'getAdapterList', (result) => {
            for(x in result){
                $('#chooseAdapter').append('<li><a href="#!" class="black-text">'+result[x]+'</a></li>')
            }
        });


    });



    $('#chooseAdapter').click((obj) => {
        actualAdapter = obj.target.innerText;
        localStorage.lastEditedAdapter = actualAdapter;
        $('#fTree').empty();
        $('#selectedAdapter').text(actualAdapter);
        main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": "getAdapterFiles", "folder": actualAdapter}, (result) => {
            for(x in result){
                if(result[x].type === 'folder') {

                    $('#fTree').append('<a id="f-'+result[x].name+'" href="#!" class="collection-item black-text as-folder" data-parent='+ result[x].parent + '><i class="tiny material-icons">folder</i>  '+result[x].name+'</a>')
                }else if(result[x].type === 'file') {

                    $('#fTree').append('<a id="f-'+result[x].name+'" href="#!" class="collection-item black-text as-file" data-parent='+ result[x].parent + '><i class="tiny material-icons">insert_drive_file</i>  '+result[x].name+'</a>')
                }
            }
            let elem = $('#fTree').find('a').sort(sortMe);

            function sortMe(a, b) {
                return a.className < b.className;
            }
            $('#fTree').append(elem);

            main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": "getRunningState", "adapterName": actualAdapter.replace('iobroker.', '')}, (result) => {
                        if(result === false){
                            $('#ssAdapter i').text('play_arrow');
                        }else if(result === true){
                            $('#ssAdapter i').text('stop');
                        }
            })
        });
    });


    $('#fTree').click((obj) => {
        let folder = obj.target.dataset.parent;
        let text = obj.target.innerText;
        const pattFolder = new RegExp('as-folder');
        const pattFile = new RegExp('as-file');


        if(pattFolder.test(obj.target.className) === true){
            if($('#' + obj.target.id + ' > a').length >0){
                $('#' + obj.target.id + ' > a').remove();
            }else{
                let name = text.replace('folder ', '');
                let folder = obj.target.dataset.parent;

                main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": "getAdapterFiles", "folder": `${folder}/${name}`}, (result) => {

                    for(x in result){
                        if(result[x].type === 'folder') {

                            $('#' + obj.target.id).append('<a id="f-'+result[x].name+'" href="#!" class="collection-item black-text as-folder" data-parent='+ result[x].parent + '><i class="tiny material-icons">folder</i>  '+result[x].name+'</a>')
                        }else if(result[x].type === 'file') {

                            $('#' + obj.target.id).append('<a id="f-'+result[x].name+'" href="#!" class="collection-item black-text as-file" data-parent='+ result[x].parent + '><i class="tiny material-icons">insert_drive_file</i>  '+result[x].name+'</a>')
                        }
                    }
                    let elem = $('#' + obj.target.id).find('a').sort(sortMe);

                    function sortMe(a, b) {
                        return a.className < b.className;
                    }
                    $('#' + obj.target.id).append(elem);

                    $('#' + obj.target.id).addClass('as-open');
                });


            }

            //Open File
        }else if(pattFile.test(obj.target.className) === true){
            let name = text.replace('insert_drive_file ', '');
            localStorage.lastOpenFile = `${folder}/${name}`;
            localStorage.lastOpenFileID = obj.target.id;
            main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": "openFile", "file": `${folder}/${name}`}, (result) => {
                let enc = new TextDecoder();
                const pattType = new RegExp(/\.\w*$/);
                let testRes = name.match(pattType);
                loadToEditor(testRes, result, (data)=> {

                    if (data) {

                        $('#imageViewer').attr("src",data)
                    }
                });
                $('#fTree .collection-item').removeClass('active grey');
                obj.target.className += ' active grey';
            })
        }
    });


    if(localStorage.lastEditedAdapter !== null && localStorage.lastEditedAdapter !== '' && localStorage.lastEditedAdapter !== undefined){
        $('#chooseAdapter').text(localStorage.lastEditedAdapter);
        $('#chooseAdapter').trigger('click');



        if(localStorage.lastOpenFile !== null && localStorage.lastOpenFile !== '' && localStorage.lastOpenFile !== undefined){
            main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": "openFile", "file": `${localStorage.lastOpenFile}`}, (result) => {
                let enc = new TextDecoder();
                const pattType = new RegExp(/\.\w*$/);
                let x = localStorage.lastOpenFile;
                let testRes;
                if(x !== undefined && x !== '' && x !== null){
                    testRes = x.match(pattType);
                }

                loadToEditor(testRes, result, (data)=>{
                    if(data){

                        $('#imageViewer img').attr("src",data)
                    }
                });


            })

        }
    }

    $('#chooseAdapter').empty();
    main.socket.emit('sendTo', 'adapter-studio.0', 'send', 'getAdapterList', function (result) {
        for(x in result){
            $('#chooseAdapter').append('<li><a href="#!" class="black-text">'+result[x]+'</a></li>')
        }
    });

    $(window).bind('beforeunload', () => {
        localStorage.fTree = $('div#fTree').html();
        let cL = editor.session.getValue().length;
        if(cl <5){

        }else{
            $('#saveFile').trigger('click');
        }

    });

    $('#saveFile').click((obj) => {
        /*
        let text = $('a.as-file.active').text();

        let name = text.replace('insert_drive_file  ', '');
        let folder = $('a.as-file.active').attr("data-parent");
        */

        let file = localStorage.lastOpenFile;

        let data = editor.session.getValue();

        let instance = M.Modal.getInstance(document.getElementById('savedModal'));
        instance.open();

        main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": "saveFile", "file": `${file}`, "data": data}, (result) => {


                setTimeout(() => {
                    instance.close()
                }, 1000);
        });
    });



    $('#uploadFiles').click((obj) => {
        let adapterName = actualAdapter.replace('iobroker.', '');
        let instance = M.Modal.getInstance(document.getElementById('waitModal'));

        instance.open();

        main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": "uploadFiles", "adapterName": `${adapterName}`}, (result) => {
                instance.close()
        });
    });

    $('#ssAdapter').click((obj) => {
        let adapterName = actualAdapter.replace('iobroker.', '');

        let iWaitModal = M.Modal.getInstance(document.getElementById('waitModal'));
        let iErrorModal = M.Modal.getInstance(document.getElementById('errorModal'));


        let x = obj.target.innerText;
        let cmd;

        if(x === 'play_arrow'){
            cmd = 'start';
        }else if(x === 'stop'){
            cmd = 'stop';
        }

        iWaitModal.open();

        main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": "ssAdapter", "adapterName": `${adapterName}`, "cmd": `${cmd}`}, (result) => {
            iWaitModal.close();

            if(cmd === 'start'){
                $('#ssAdapter i').text('stop');
                console.log('TEST stop');
            }else if(cmd === 'stop'){
                $('#ssAdapter i').text('play_arrow');
                console.log('TEST start');
            }
            if(result === 'Error'){
                iErrorModal.open();
            }

        });
    });

    $('#rsAdapter').click((obj) => {
        let adapterName = actualAdapter.replace('iobroker.', '');

        let iWaitModal = M.Modal.getInstance(document.getElementById('waitModal'));
        let iErrorModal = M.Modal.getInstance(document.getElementById('errorModal'));


        let x = obj.target.innerText;
        let cmd = 'restart';


        iWaitModal.open();

        main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": "ssAdapter", "adapterName": `${adapterName}`, "cmd": `${cmd}`}, (result) => {
            iWaitModal.close();


                $('#ssAdapter i').text('stop');


            if(result === 'Error'){
                iErrorModal.open();
            }

        });
    });

    $('#publishTo').click((obj) => {
        let to = obj.target.innerText;
        let cmd;
        if(to === 'npm'){
            cmd = 'npmPublish'
        }else if(to === 'github'){
            cmd = 'githubPublish'
        }
        let iWaitModal = M.Modal.getInstance(document.getElementById('waitModal'));
        let iErrorModal = M.Modal.getInstance(document.getElementById('errorModal'));
        let iNpmLoginModal = M.Modal.getInstance(document.getElementById('npmLoginModal'));
        iWaitModal.open();
        main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": `${cmd}`, "adapterName": `${actualAdapter}`}, (result) => {
            iWaitModal.close();

            if(result === 'Error'){
                iErrorModal.open();
            }else if(result === 'Login required'){
                iNpmLoginModal.open();
            }
        });
    });

    $('#npmLogin').click((obj) => {
        let user = $('#npmUser').val();
        let password = $('#npmPassword').val();
        let email = $('#npmEmail').val();

        let iWaitModal = M.Modal.getInstance(document.getElementById('waitModal'));
        let iErrorModal = M.Modal.getInstance(document.getElementById('errorModal'));

        main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": `npmAddUser`, "user": `${user}`, "password": `${password}`, "email": `${email}`}, (result) => {
            if(result === 'Error'){
                iErrorModal.open();
            }else if(result === 'Done'){
                main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": `npm publish`, "adapterName": `${actualAdapter}`}, (result) => {
                    iWaitModal.close();

                    if(result === 'Error'){
                        iErrorModal.open();
                    }else if(result === 'Login required'){
                        iNpmLoginModal.open();
                        $('#publishTo').trigger('click');
                    }
                });
            }

        })
    });

    $('#gitLink').click(function(){
        let link = $('#urlRepo').val();
        let iWaitModal = M.Modal.getInstance(document.getElementById('waitModal'));
        let iErrorModal = M.Modal.getInstance(document.getElementById('errorModal'));
        iWaitModal.open();

        main.socket.emit('sendTo', 'adapter-studio.0', 'send', {"command": `checkoutGithub`, "link": `${link}`}, (result) => {
            if(result === 'Error'){
                iErrorModal.open();
            }else if(result === 'Done'){
                iWaitModal.close();
            }

        })

    });
}

function loadToEditor(fileType, content, callback){
    let enc = new TextDecoder();
    let type;
    if(fileType === null){
        type = '';
    }else{
        type = fileType[0];
    }

        switch(type){
            case '.md':
            case '.MD':
            case 'md':
            case 'MD':
                editor.session.setMode("ace/mode/markdown");
                break;
            case '.json':
            case '.JSON':
            case 'json':
            case 'JSON':
                editor.session.setMode("ace/mode/json");
                break;
            case '.html':
            case '.HTML':
            case 'html':
            case 'HTML':
                editor.session.setMode("ace/mode/html");
                break;
            case '.css':
            case '.CSS':
            case 'CSS':
            case 'css':
                editor.session.setMode("ace/mode/css");
                break;
            case '.js':
            case '.JS':
            case 'js':
            case 'JS':
                editor.session.setMode("ace/mode/javascript");
                break;
            case '':
            case 'null':
            case '.txt':
            case '.TXT':
            case 'txt':
            case 'TXT':
                editor.session.setMode("ace/mode/text");
                break;
            case '.yaml':
            case '.YAML':
            case '.yml':
            case '.YML':
            case 'yaml':
            case 'YAML':
            case 'yml':
            case 'YML':
                editor.session.setMode("ace/mode/yaml");
                break;
        }
        if(type !== '.png' && type !== '.PNG' && type !== '.jpg' && type !== '.JPG' && type !== '.jpeg' && type !== '.JPEG'){
            $('#imageViewer').addClass('hide');
            $('#editor').removeClass('hide');
            editor.session.setValue(enc.decode(content));
        }else{
            $('#editor').addClass('hide');
            $('#imageViewer').removeClass('hide');
            let newPic = `data:image/png;base64,${content}`;
            callback(newPic);

        }

}

function createAdapter(){
    let iWaitModal = M.Modal.getInstance(document.getElementById('waitModal'));
    let iErrorModal = M.Modal.getInstance(document.getElementById('errorModal'));
    iWaitModal.open();
    main.socket.emit('sendTo', 'adapter-studio.0', 'send', {
        command: 'createAdapter',
        name: $('#adapter-name').val(),
        author: $('#author-name').val(),
        email: $('#author-email').val(),
        keywords: $('#keywords').val(),
        license: $('#sLicense').val(),
        type: $('#sType').val(),
        mode: $('#sMode').val(),
        cron: $('#cron').val(),
        logLevel: $('#sLogLevel').val(),
        dependencies: $('#dependencies').val(),
        enabled: $('#cbEnabled').prop('checked'),
        widgets: $('#cbWidgets').prop('checked'),
        webpage: $('#cbWWW').prop('checked'),
        tab: $('#cbAdmTab').prop('checked'),
        adminv2: $('#cbAdminV2').prop('checked'),
        messagebox: $('#cbMessageBox').prop('checked'),
        depAdapters: $('#depAdapters').val()
    }, (result) => {
        console.log(result);
        iWaitModal.open();
        if(result === 'Error'){
            iErrorModal.open();
        }else if(result === 'Done'){
            iWaitModal.close();
            let name = $('#adapter-name').val();
            name = name.toLowerCase();
            actualAdapter = `iobroker.${name}`;
            localStorage.lastOpenFile = '';
            setTimeout(() => {
                $('#liEditor')[0].click();
            }, 500);

        }
    });

}

let firstConnect = true;


//Definition für socket.io Verbindung
let main = {
    socket:         io.connect(location.protocol + '//' + location.host, {
        query: 'ws=true'
    }),
    saveConfig:     (attr, value) => {
        if (!main.config) return;
        if (attr) main.config[attr] = value;

        if (typeof storage !== 'undefined') {
            storage.set('adminConfig', JSON.stringify(main.config));
        }
    },
    showError:      (error, cb) => {
        main.showMessage(_(error),  _('Error'), 'alert', cb);
    },
    showMessage:    (message, title, icon, cb)  => {
        if (typeof title === 'function') {
            cb = title;
            title = null;
            icon = null;
        }
        if (typeof icon === 'function') {
            cb = icon;
            icon = null;
        }
        $dialogMessage.dialog('option', 'title', title || _('Message'));
        $('#dialog-message-text').html(message);

        if (icon) {
            if (!icon.match(/^ui\-icon\-/)) icon = 'ui-icon-' + icon;

            $('#dialog-message-icon')
                .show()
                .attr('class', '')
                .addClass('ui-icon ' + icon);
        } else {
            $('#dialog-message-icon').hide();
        }
        $dialogMessage.data('callback', cb);
        $dialogMessage.dialog('open');
    },
    confirmMessage: (message, title, icon, buttons, callback) => {
        if (typeof buttons === 'function') {
            callback = buttons;
            $dialogConfirm.dialog('option', 'buttons', [
                {
                    text: _('Ok'),
                    click: () => {
                        let cb = $(this).data('callback');
                        $(this).dialog('close');
                        if (cb) cb(true);
                    }
                },
                {
                    text: _('Cancel'),
                    click: () => {
                        let cb = $(this).data('callback');
                        $(this).dialog('close');
                        if (cb) cb(false);
                    }
                }

            ]);
        } else if (typeof buttons === 'object') {
            for (let b = 0; b < buttons.length; b++) {
                buttons[b] = {
                    text: buttons[b],
                    id: 'dialog-confirm-button-' + b,
                    click: (e) => {
                        let id = parseInt(e.currentTarget.id.substring('dialog-confirm-button-'.length), 10);
                        let cb = $(this).data('callback');
                        $(this).dialog('close');
                        if (cb) cb(id);
                    }
                }
            }
            $dialogConfirm.dialog('option', 'buttons', buttons);
        }

        $dialogConfirm.dialog('option', 'title', title || _('Message'));
        $('#dialog-confirm-text').html(message);
        if (icon) {
            $('#dialog-confirm-icon')
                .show()
                .attr('class', '')
                .addClass('ui-icon ui-icon-' + icon);
        } else {
            $('#dialog-confirm-icon').hide();
        }
        $dialogConfirm.data('callback', callback);
        $dialogConfirm.dialog('open');
    },
    initSelectId:   () => {
        if (main.selectId) return main.selectId;
        main.selectId = $('#dialog-select-member').selectId('init',  {
            objects: main.objects,
            states:  main.states,
            noMultiselect: true,
            imgPath: '../../lib/css/fancytree/',
            filter: {type: 'state'},
            getObjects: getObjects,
            texts: {
                select:   _('Select'),
                cancel:   _('Cancel'),
                all:      _('All'),
                id:       _('ID'),
                name:     _('Name'),
                role:     _('Role'),
                room:     _('Room'),
                value:    _('Value'),
                selectid: _('Select ID'),
                from:     _('From'),
                lc:       _('Last changed'),
                ts:       _('Time stamp'),
                wait:     _('Processing...'),
                ack:      _('Acknowledged')
            },
            columns: ['image', 'name', 'role', 'room', 'value']
        });
        return main.selectId;
    },
    subscribe:      (isSubscribe) => {
        if (!main.socket) return;
        if (isSubscribe) {
            main.socket.emit('subscribeObjects', 'script.*');
            main.socket.emit('subscribeObjects', 'system.adapter.*');
            main.socket.emit('requireLog', true);
        } else {
            main.socket.emit('unsubscribeObjects', 'script.*');
            main.socket.emit('unsubscribeObjects', 'system.adapter.*');
            main.socket.emit('requireLog', false);
        }
    },
    objects:        {},
    states:         {},
    currentHost:    '',
    instances:      [],
    objectsLoaded:  false,
    waitForRestart: false,
    selectId:       null
};

main.socket.on('permissionError', (err) => {
    main.showMessage(_('Has no permission to %s %s %s', err.operation, err.type, (err.id || '')));
});
main.socket.on('objectChange', (id, obj) => {
    //setTimeout(objectChange, 0, id, obj);
    console.log(id);
});
main.socket.on('stateChange', (id, obj) => {
    console.log(id);
});
main.socket.on('connect',() => {
    $('#connecting').hide();
    if (firstConnect) {
        firstConnect = false;

        main.socket.emit('getUserPermissions', (err, acl) => {
            main.acl = acl;
            // Read system configuration
            main.socket.emit('getObject', 'system.config', (err, data) => {
                main.systemConfig = data;
                if (!err && main.systemConfig && main.systemConfig.common) {
                    systemLang = main.systemConfig.common.language;
                } else {
                    systemLang = window.navigator.userLanguage || window.navigator.language;

                    if (systemLang !== 'en' && systemLang !== 'de' && systemLang !== 'ru') {
                        main.systemConfig.common.language = 'en';
                        systemLang = 'en';
                    }
                }

            });
        });
    }
    main.subscribe(true);
    if (main.waitForRestart) {
        location.reload();
    }
});
main.socket.on('disconnect', () => {
    $('#connecting').show();
});
main.socket.on('reconnect', () => {
    $('#connecting').hide();
    if (main.waitForRestart) {
        location.reload();
    }
});
main.socket.on('reauthenticate', () => {
    location.reload();
});
main.socket.on('log', (message) => {
    //setTimeout(onLog, 0, message);
    console.log(message);
});

let core = new Core(main);