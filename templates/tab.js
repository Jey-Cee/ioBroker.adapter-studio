
function Core(main) {
    //init materializecss functions
    $('.tabs').tabs();

    //react to user events
    $('#btn1').click(function(){
        sendToAdapterInstance();
    });

}


function sendToAdapterInstance(){
    main.socket.emit('sendTo', 'adapter.0', {
        command: 'your command',
    }, function (result) {
        console.log(result);
    });

}

let firstConnect = true;


//Definition for socket.io connection
let main = {
    socket:         io.connect(location.protocol + '//' + location.host, {
        query: 'ws=true'
    }),
    saveConfig:     function (attr, value) {
        if (!main.config) return;
        if (attr) main.config[attr] = value;

        if (typeof storage !== 'undefined') {
            storage.set('adminConfig', JSON.stringify(main.config));
        }
    },
    showError:      function (error, cb) {
        main.showMessage(_(error),  _('Error'), 'alert', cb);
    },
    showMessage:    function (message, title, icon, cb) {
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
    confirmMessage: function (message, title, icon, buttons, callback) {
        if (typeof buttons === 'function') {
            callback = buttons;
            $dialogConfirm.dialog('option', 'buttons', [
                {
                    text: _('Ok'),
                    click: function () {
                        let cb = $(this).data('callback');
                        $(this).dialog('close');
                        if (cb) cb(true);
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
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
                    click: function (e) {
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
    initSelectId:   function () {
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
    subscribe:      function (isSubscribe) {
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

main.socket.on('permissionError', function (err) {
    main.showMessage(_('Has no permission to %s %s %s', err.operation, err.type, (err.id || '')));
});
main.socket.on('objectChange', function (id, obj) {
    //setTimeout(objectChange, 0, id, obj);
    console.log(id);
});
main.socket.on('stateChange', function (id, obj) {
    console.log(id);
});
main.socket.on('connect', function () {
    $('#connecting').hide();
    if (firstConnect) {
        firstConnect = false;

        main.socket.emit('getUserPermissions', function (err, acl) {
            main.acl = acl;
            // Read system configuration
            main.socket.emit('getObject', 'system.config', function (err, data) {
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
main.socket.on('disconnect', function () {
    $('#connecting').show();
});
main.socket.on('reconnect', function () {
    $('#connecting').hide();
    if (main.waitForRestart) {
        location.reload();
    }
});
main.socket.on('reauthenticate', function () {
    location.reload();
});
main.socket.on('log', function (message) {
    //setTimeout(onLog, 0, message);
    console.log(message);
});

let core = new Core(main);