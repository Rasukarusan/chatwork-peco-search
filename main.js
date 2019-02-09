setTimeout(main, 1000);
// FIXME: chatworkのアップデートによりDOM要素の挙動が変わり、機能しなくなった。
// setTimeoutで遅延させることで対応したが、暴挙すぎるのでFIXME。

function main() {
const MAX_LOAD_COUNT = 5;
var load_count = 0;
var last_search_word = '';
var last_room_id = location.href.split('rid')[1];
var time_line_element = document.getElementById('_timeLine');

var mo = new MutationObserver(search);
mo.observe(time_line_element, {
    childList: true
});

addSearchBox();

// メッセージを受け取る
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    var time_line = $('#_timeLine').children();
    search();
    // フォーカスが当たっている要素を取得する
    var focused = $(':focus');
    if($(focused).attr('id') === 'peco_search'){
        load_count++;
    }
});

/**
 * 検索ボックスに入力があった際の処理（メイン）
 *
 * @return void
 */
function search() {
    // 別のチャットへ移動したときに検索ボックスが空になるようにする
    var room_id = location.href.split('rid')[1];
    if(room_id != last_room_id) {
        $('#peco_search').val('')
        last_room_id = room_id;
        initLoadCount();
    }

    var search_word = $('#peco_search').val();
    if (search_word == '') {
        restoreTimeLine();
        if($(':focus').attr('id') === 'peco_search'){
            // 一番下までスクロールする
            $('#_timeLine').animate({scrollTop: $('#_timeLine')[0].scrollHeight}, 'fast');
        }
        initLoadCount();
    }else if(last_search_word != search_word) {
        initLoadCount();
    }
    $('.timeLine__dateHead').remove();
    var time_line = $('#_timeLine').children();

    if(load_count < MAX_LOAD_COUNT){
        filterTimeLine(time_line, search_word);
    } else if(load_count === MAX_LOAD_COUNT) {
        sendMsgToChromeBackground('stop');
        // mo.disconnect();
        filterTimeLine(time_line, search_word);
        $('.timeLine__loading').text('過去200件で遡りました。');
    }
    last_search_word = search_word;
}


/**
 * メッセージの表示・非表示を行う
 *
 * @param array time_line    チャットのメッセージが格納された配列
 * @param string filter_word フィルタリングする単語文字列
 * @return void
 */
function filterTimeLine(time_line, filter_word) {
    var time_line_length = time_line.length;
    /* メッセージを続けて投稿するとspeakerNameに名前が入らないので名前でヒットさせる方法が使えない。
     * speakerNameがない連投されたメッセージをキャッチするため、対象の名前が出現したらフラグをONにして
     * ONの間はメッセージを表示し、次に対象ではない名前が出てきたらOFFにする。
     */
    var is_appearance = false;
    for (var i = 0; i < time_line_length; i++) {
        if ($(time_line[i]).attr('id')) {
            var user_name = $(time_line[i]).find('._speakerName').text().toLowerCase();
            if (user_name.indexOf(filter_word) != -1) {
                $(time_line[i]).show();
                is_appearance = true;
            } else if (is_appearance === true && user_name === '') {
                $(time_line[i]).show();
            } else {
                $(time_line[i]).hide();
                is_appearance = false;
            }
        }
    }
}

/**
 * ロード回数の初期化
 *
 * @return void
 */
function initLoadCount() {
    load_count = 0;
    sendMsgToChromeBackground('start');
}

/**
 * background.jsにメッセージを渡す
 *
 * @param string message 渡したい文字列
 * @return void
 */
function sendMsgToChromeBackground(message) {
    chrome.runtime.sendMessage(message,
        function(response){
        }
    );
}


/**
 * タイムラインを元に戻す
 *
 * @return void
 */
function restoreTimeLine() {
    var time_line = $('#_timeLine').children();
    var time_line_length = time_line.length;
    for (var i = 0; i < time_line_length; i++) {
        $(time_line[i]).show();
    }
}

/**
 * 検索ボックスを追加
 */
function addSearchBox() {
    $('#peco_search').remove();
    var search_box = '<input type="text" id="peco_search" placeholder="ユーザー名で検索" style="width:30%;height:80%;margin-left:10px;">';
    $('#_chatSendTool').after(search_box);
    $('#peco_search').on('input', search);
}
}
