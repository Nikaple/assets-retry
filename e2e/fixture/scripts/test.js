setTimeout(function () {
    var loadedScripts = window.loadedScripts || {};
    var getStyle = function (el) { return window.getComputedStyle ? window.getComputedStyle(el) : {}; };
    var $id = function (id) { return document.getElementById(id); };
    var result =
        [
            'vendor loaded: ' + loadedScripts.vendor,
            'sync chunk loaded: ' + loadedScripts.sync,
            'async chunk loaded: ' + loadedScripts.async,
            'ok css loaded: ' + /dashed/.test((getStyle(document.body).textDecoration)),
            'sync css loaded: ' + (getStyle(document.body).backgroundRepeat == 'no-repeat'),
            'async css loaded: ' + (getStyle(document.body).borderStyle === 'solid'),
            'img tag loaded: ' + /fixture/.test($id('img').src),
            'image in sync css: ' + /fixture/.test(getStyle($id('cssSync')).backgroundImage),
            'image in async css: ' + /fixture/.test(getStyle($id('cssAsync')).backgroundImage)
        ].join('\n')
    document.getElementById('result').outerHTML = '<pre>' + result + '</pre>';
}, 5000)