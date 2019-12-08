setTimeout(function() {
    var loadedScripts = window.loadedScripts || {};
    var getStyle = window.getComputedStyle.bind(window);
    var $id = document.getElementById.bind(document)
    var result = 
        'vendor loaded: ' + loadedScripts.vendor + '\n' +
        'sync chunk loaded: ' + loadedScripts.sync + '\n' +
        'async chunk loaded: ' + loadedScripts.async + '\n' +
	    'sync css loaded: ' + (getStyle(document.body).backgroundRepeat == 'no-repeat') + '\n' +
	    'async css loaded: ' + (window.getComputedStyle(document.body).borderStyle === 'solid') + '\n' + 
        'img tag loaded: ' + /fixture/.test($id('img').src) + '\n' + 
        'image in sync css: ' + /fixture/.test(getStyle($id('cssSync')).backgroundImage) + '\n' +
        'image in async css: ' + /fixture/.test(getStyle($id('cssAsync')).backgroundImage) + '\n';
    document.body.innerHTML += '<div id="result"><pre>' + result + '</pre></div>';
}, 5000)
