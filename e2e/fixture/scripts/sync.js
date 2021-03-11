vendor();
console.log('sync')
window.loadedScripts = window.loadedScripts || {};
window.loadedScripts.sync = true;

var loadScript = function (src, cb) {
    var $script = document.createElement('script')
    $script.src = src;
    var onComplete = function (event) {
        $script.onload = $script.onerror = null;
        cb(event)
    }
    $script.onload = onComplete;
    $script.onerror = onComplete;
    document.getElementsByTagName('head')[0].appendChild($script);
}

var loadCss = function (href, cb) {
    cb = cb || function () { };
    var $link = document.createElement('link')
    $link.href = href;
    $link.rel = $link.rev = 'stylesheet';
    $link.type = 'text/css';
    var onComplete = function (event) {
        $link.onload = $link.onerror = null;
        cb(event)
    }
    $link.onload = onComplete;
    $link.onerror = onComplete;
    document.getElementsByTagName('head')[0].appendChild($link);
}

window.onload = function () {
    loadScript('/e2e/not-exist/scripts/async.js', function (event) {
        var statistics = '';
        var winStat = window.stat;
        for (var key in winStat) {
            var curStat = window.stat[key]
            var stat = {
                retryTimes: curStat.retryTimes,
                failedLength: curStat.failed.length,
                succeededLength: curStat.succeeded.length
            }
            statistics += key + ': \n' + JSON.stringify(stat) + '\n\n';
        }
        var div = document.createElement('div');
        div.innerHTML = '<pre style="font-size: 14px">' + statistics + '</pre>';
        document.body.appendChild(div)
    })
    loadCss('/e2e/not-exist/styles/async.css')
}
