var isEnableLoad = true;

chrome.tabs.onUpdated.addListener(function() {
  isEnableLoad = true;
});

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if(!isEnableLoad) {
            return {cancel: true};
        }else{
            // 現在のタブを取得する
            chrome.tabs.query(
                {
                    active: true,
                    windowId: chrome.windows.WINDOW_ID_CURRENT
                },
                function (result) {
                    var currentTab = result.shift();
                    // 取得したタブに対してメッセージを送る
                    chrome.tabs.sendMessage(currentTab.id, details.url, function() {});
                }
            );
        }
    },
    {urls: ['https://kcw.kddi.ne.jp/gateway.php?cmd=load_old_chat*']},
    // {urls: ['<all_urls>']},
    ["blocking"]
);

chrome.runtime.onMessage.addListener(
	function(request,sender,sendResponse){
        var response = '';
        switch (request) {
            case 'stop':
                isEnableLoad = false;
                response = 'OK, Stop Load.';
                break;
            case 'start':
                isEnableLoad = true;
                response = 'OK, Start Load.';
                break;
            default:
        }
		sendResponse(response);
	}
);
