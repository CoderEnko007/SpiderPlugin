console.log('hello from background!')
var current_mode = -100 // MODE_ID.MODE_NONE保持一致
var temp_deck_list = []
var meta_info = {list:[], rank_range:''}
var tier_list_rank_range_array = []
var total_tier_list = []
var temp_meta_list = []
var meta_list_rank_range_array = []
var meta_filterd_faction = []

function getTempDeckList() {
    return temp_deck_list
}

function clearAllCache() {
    current_mode = MODE_ID.MODE_NONE
    temp_deck_list = []
    meta_info = {list:[], rank_range:''}
    tier_list_rank_range_array = []
    total_tier_list = []
    temp_meta_list = []
    meta_list_rank_range_array = []
    meta_filterd_faction = []
}

var cookies={}

chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse)
{
    chrome.cookies.getAll({name: 'csrftoken', url: host}, (res) => {
        // console.log('csrftoken', res)
        cookies.csrftoken = res.length?res[0].value:null
    })
    var msg = request.msg
    var payload = request.payload
    console.log('后台收到来自content-script或popup的消息：', msg, payload);
    var res_msg
    console.log('当前模式:', current_mode)
    switch(msg) {
        case MSG_ID.MSG_ANALYSIS_DECKS: {
            temp_deck_list = payload
            res_msg = temp_deck_list
            if (current_mode == MODE_ID.MODE_BEST_DECKS) {
                break
            }
            current_mode = MODE_ID.MODE_DECKS
        }
        break;
        case MSG_ID.MSG_ANALYSIS_TRENDING: {
            temp_deck_list = payload
            res_msg = temp_deck_list
            current_mode = MODE_ID.MODE_TRENDING
        }; 
        break;
        case BG_MSG_ID.MSG_ANALYSIS_BEST_DECKS: {
            temp_deck_list = payload
            res_msg = temp_deck_list
            current_mode = MODE_ID.MODE_BEST_DECKS
        };
        break;
        case BG_MSG_ID.MSG_UPDATE_TIER_LIST: {
            total_tier_list = []
            tier_list_rank_range_array = payload
            res_msg = tier_list_rank_range_array
            current_mode = MODE_ID.MODE_TIER_LIST
        };
        case BG_MSG_ID.TIER_LIST_PAGE_LOADED: {
            for (var item of tier_list_rank_range_array) {
                if (!item.checked) {
                    console.log('通知content-script解析页面：', item)
                    sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                        mode: current_mode, 
                        text: '开始解析TierList数据：'+rank_range_objs[item.range]}
                    })
                    sendMessageToContentScript1({msg: CS_MSG_ID.MSG_UPDATE_TIER_LIST, payload: item})
                    break
                }
            }
        };
        break;
        case BG_MSG_ID.MSG_UPDATE_META_BY_CLASS_ALL: {
            temp_meta_list = []
            meta_list_rank_range_array = payload.rank_range
            meta_filterd_faction = payload.faction
            res_msg = meta_list_rank_range_array
            current_mode = MODE_ID.MODE_META_BY_CLASS_ALL
        };
        break;
        case BG_MSG_ID.MSG_META_PAGE_LOADED: {
            for (var item of meta_list_rank_range_array) {
                if (!item.checked) {
                    console.log('111 BG_MSG_ID.MSG_META_PAGE_LOADED， 通知content-script解析页面：', item)
                    item.checked = true
                    sendMessageToPopup({
                        msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, 
                        payload: {mode: current_mode, text: '开始解析meta页面：'+rank_range_objs[item.range]}})
                    sendMessageToContentScript1({
                        msg: CS_MSG_ID.MSG_ANALYSIS_META_BY_CLASS, 
                        payload: {range: item.range, faction: meta_filterd_faction}})
                    break
                }
            }
        };
        break;
        case MSG_ID.MSG_ANALYSIS_META_BY_CLASS: {
            meta_info.list = payload.list
            meta_info.rank_range = payload.rank_range
            res_msg = meta_info
            current_mode = MODE_ID.MODE_META_BY_CLASS_ALL
            console.log('MSG_ID.MSG_ANALYSIS_META_BY_CLASS：', meta_info)
            if (meta_info.rank_range != 'BRONZE_THROUGH_GOLD') {
                for(var faction in meta_info.list) {
                    var temp_list = meta_info.list[faction]
                    for (var i=0; i<temp_list.length; i++) {
                        sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                            mode: current_mode, 
                            text: '正在同步：'+rank_range_objs[temp_list[i].rank_range]+'（'+(i+1)+'/'+temp_list.length+'）'+temp_list[i].archetype}
                        })
                        await updateMetaArchetype(temp_list[i])
                    }
                }
                console.log(meta_list_rank_range_array)
                for (var item of meta_list_rank_range_array) {
                    if (!item.checked) {
                        console.log('222 MSG_ID.MSG_ANALYSIS_META_BY_CLASS, 通知content-script解析页面：', item.range, item)
                        item.checked = true
                        sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                            mode: current_mode, 
                            text: '准备解析 '+rank_range_objs[item.rank]+' 分段数据'}
                        })
                        sendMessageToContentScript1({msg: CS_MSG_ID.MSG_ANALYSIS_META_BY_CLASS, payload: {range: item.range, faction: meta_filterd_faction}})
                        return
                    }
                }
                current_mode = MODE_ID.MODE_NONE
                alert('解析完毕')
            } else {
                console.log('处理meta详情', meta_info.list)
                for (var faction in meta_info.list) {
                    var temp_list = meta_info.list[faction]
                    for (var item of temp_list) {
                        if (item.archetype == 'Other') {
                            console.log('处理各职业Other数据（'+rank_range_objs[item.range]+'）: '+item.faction+' Other')
                            sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                                mode: current_mode, 
                                text: '同步各职业Other数据: '+item.faction+' Other'}
                            })
                            await updateMetaArchetype(item)
                        }
                    }
                }
                sendMessageToPopup({msg: MSG_ID.MSG_ANALYSIS_META_BY_CLASS, payload: meta_info})
            }
        };
        break;
        case BG_MSG_ID.MSG_UPDATE_DECK: {
            console.log('后台消息BG_MSG_ID.MSG_UPDATE_DECK:', temp_deck_list, payload)
            for (var i=0; i<temp_deck_list.length; i++) {
                if (temp_deck_list[i].deck_id === payload.deck_id) {
                    if (temp_deck_list[i].deck_name != payload.deck_name) {
                        if (temp_deck_list[i].deck_name.indexOf('GLOBAL')>=0) {
                            temp_deck_list[i].deck_name = payload.deck_name
                        }
                    }
                    temp_deck_list[i].handled_flag = true
                    temp_deck_list[i].real_game_count = payload.real_game_count
                    temp_deck_list[i].card_list = payload.card_list
                    temp_deck_list[i].turns = payload.turns
                    temp_deck_list[i].real_win_rate = payload.real_win_rate
                    temp_deck_list[i].faction_win_rate = payload.faction_win_rate
                    temp_deck_list[i].mode = payload.mode
                    temp_deck_list[i].last_30_days = payload.last_30_days
                    temp_deck_list[i].create_time = dateFormat("YYYY-mm-dd", new Date())
                    if (!temp_deck_list[i].dust_cost) {
                        temp_deck_list[i].dust_cost = payload.dust_cost
                    }
                    if (!temp_deck_list[i].duration) {
                        temp_deck_list[i].duration = payload.duration
                    }
                    console.log('mulligan是否存在：',payload.mulligan_flag)
                    if (payload.mulligan_flag) {
                        console.log('background——>popup=========打开mulligan页面', temp_deck_list[i])
                        sendMessageToPopup({msg: POP_MSG_ID.MSG_OPEN_MULLIGAN_PAGE, payload: temp_deck_list[i]})
                    } else {
                        temp_deck_list[i].mulligan = []
                        console.log('background——>popup=========mulligan不存在，跳过', temp_deck_list[i])
                        console.log('current_mode:', current_mode)
                        if (current_mode == MODE_ID.MODE_TRENDING) {
                            updateTrendingDeck(temp_deck_list[i])
                            sendMessageToPopup({msg: MSG_ID.MSG_ANALYSIS_TRENDING, payload: temp_deck_list[i]})
                        } else if (current_mode == MODE_ID.MODE_DECKS || current_mode == MODE_ID.MODE_BEST_DECKS) {
                            updateDecks(temp_deck_list[i])
                            sendMessageToPopup({msg: MSG_ID.MSG_ANALYSIS_DECKS, payload: temp_deck_list[i]})
                        }
                    }
                }
            }
            res_msg = temp_deck_list
        };
        break;
        case BG_MSG_ID.MSG_HANDLE_MULLIGAN: {
            for (var i=0; i<temp_deck_list.length; i++) {
                if (temp_deck_list[i].deck_id === payload.deck_id) {
                    console.log('添加mulligan:', payload.mulligan)
                    temp_deck_list[i].mulligan = payload.mulligan
                    console.log('卡组准备完毕，查询是否存在!', i, temp_deck_list)
                    if (current_mode == MODE_ID.MODE_TRENDING) {
                        updateTrendingDeck(temp_deck_list[i])
                        sendMessageToPopup({msg: MSG_ID.MSG_ANALYSIS_TRENDING, payload: temp_deck_list[i]})
                    } else if (current_mode == MODE_ID.MODE_DECKS || current_mode == MODE_ID.MODE_BEST_DECKS) {
                        updateDecks(temp_deck_list[i])
                        sendMessageToPopup({msg: MSG_ID.MSG_ANALYSIS_DECKS, payload: temp_deck_list[i]})
                    }
                }
            }
        };
        break;
        case BG_MSG_ID.MSG_UPDATE_META_BY_CLASS: {
            console.log('message MSG_UPDATE_META_BY_CLASS:', meta_info)
            console.log('payload:', payload)
            // current_mode = MODE_ID.MODE_META_DETAIL
            res_msg = meta_info
            for (var item of meta_info.list[payload.faction]) {
                if (item.archetype == payload.archetype) {
                    item.checked = true
                    Object.assign(item, payload)
                    console.log('更新meta信息:', item, meta_info)
                    var res = await getMetaData({faction: item.faction, archetype: item.archetype, 
                                                rank_range:item.rank_range, create_time: dateFormat("YYYY-mm-dd", new Date())})
                    if(res.count) {
                        console.log('meta已存在，准备更新！')
                        res = await updateMetaData(res.results[0].id, item)
                        console.log('meta更新完毕:', item.archetype)
                    } else {
                        console.log('meta不存在，准备添加！')
                        res = await addMetaData(item)
                        console.log('meta添加完毕:', item.archetype)
                    }
                    sendMessageToPopup({msg: MSG_ID.MSG_ANALYSIS_META_BY_CLASS, payload: {rank_range: meta_info.rank_range}})
                }
            }
        };
        break;
        case BG_MSG_ID.MSG_ANALYSIS_TIER_END: {
            var tier_list = payload.list
            total_tier_list.push({range: payload.range, list: tier_list})
            console.log('total_tier_list:',total_tier_list, payload)
            for (var item of tier_list_rank_range_array) {
                if (item.range == payload.range) {
                    item.checked = true
                }
                if (!item.checked) {
                    console.log('通知content-script解析页面：', item)
                    sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                        mode: current_mode, 
                        text: '开始解析TierList数据：'+rank_range_objs[item.range]}
                    })
                    sendMessageToContentScript1({msg: CS_MSG_ID.MSG_UPDATE_TIER_LIST, payload: item})
                    return
                }
            }
            res_msg = total_tier_list
            console.log('tierlist页面解析完毕')
            sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                mode: current_mode, 
                text: 'TierList数据解析完毕'}
            })
            for (var i=0; i<total_tier_list.length; i++) {
                var item = total_tier_list[i]
                var rank_range = item.range
                var list = item.list
                for(var j=0; j<list.length; j++) {
                    var obj = list[j]
                    var text_info = '开始同步（'+(j+1)+'/'+list.length+'）：'+rank_range_objs[rank_range]+' '+obj.archetype_name
                    sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                        mode: current_mode, 
                        text: text_info
                    }})
                    await handleTierListItem(rank_range, obj, text_info)
                }
            }
            console.log('tierlist上传完毕')
            alert('上传完毕！')
            current_mode = MODE_ID.MODE_NONE
        };
        break;
        case BG_MSG_ID.MSG_UPDATE_RANK_DATA: {
            current_mode = MODE_ID.MODE_RANK
            res_msg = null
        };
        break;
        case BG_MSG_ID.MSG_UPLOAD_RANK_DATA: {
            var rank_list = payload
            console.log('aa', rank_list)
            for (var i=0; i<rank_list.length; i++) {
                var item = rank_list[i]
                var str = (i+1)+'/'+rank_list.length
                sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                    mode: current_mode, 
                    text: str+' '+item.faction+'--'+rank_objs[item.game_type]+'   查询数据是否存在'
                }})
                var res = await getRankData({'game_type': item.game_type, 'faction': item.faction, 'report_time': dateFormat("YYYY-mm-dd", new Date())})
                if (res.count>0) {
                    console.log('当天数据已存在，准备更新！')
                    sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                        mode: current_mode, 
                        text: str+' '+item.faction+'--'+rank_objs[item.game_type]+'   当天数据已存在，开始更新'
                    }})
                    res = await updateRankData(res.results[0].id, item)
                    console.log('更新完毕:', item.faction, item.game_type)
                } else {
                    console.log('当天数据不存在，准备添加！')
                    sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                        mode: current_mode, 
                        text: str+' '+item.faction+'--'+rank_objs[item.game_type]+'   当天数据不存在，开始添加'
                    }})
                    res = await addRankData(item)
                    console.log('添加完毕:', item.faction, item.game_type)
                }
            }
            alert('更新完毕')
            sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                mode: current_mode, 
                text: '更新完毕'
            }})
            current_mode = MODE_ID.MODE_NONE
        };
        break;
        case MSG_ID.MSG_GET_TRENDING_DECKS: {
            res_msg = temp_deck_list
        };
        break;
        case MSG_ID.MSG_GET_CURRENT_MODE: {
            res_msg = current_mode
        };
        break;
        case MSG_ID.MSG_SET_CURRENT_MODE: {
            current_mode = payload
        };
        break;
        default: {
            console.log('未知消息！', msg)
        }
    }
    console.log('后台返回消息:', res_msg)
    if (sendResponse) {
        sendResponse({msg: msg, payload: res_msg});
    }
});

function getCurrentTabId2(callback)
{
	chrome.windows.getCurrent(function(currentWindow)
	{
		chrome.tabs.query({active: true, windowId: currentWindow.id}, function(tabs)
		{
			if(callback) callback(tabs.length ? tabs[0].id: null);
		});
	});
}
// 获取当前选项卡ID
function getCurrentTabId(callback) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
	{
		if(callback) callback(tabs.length ? tabs[0].id: null);
	});
}

// 向content-script主动发送消息
function sendMessageToContentScript1(message, callback) {
	getCurrentTabId2((tabId) =>
	{
		chrome.tabs.sendMessage(tabId, message, function(response)
		{
			if(callback) callback(response);
		});
	});
}
function sendMessageToContentScript(message, callback)
{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
	{
		chrome.tabs.sendMessage(tabs[0].id, message, function(response)
		{
			if(callback) callback(response);
		});
	});
}

function sendMessageToPopup(message) {
	chrome.runtime.sendMessage(message, function(response) {
		console.log('收到popup回复：', response);
	});
}

async function updateTrendingDeck(deck) {
    var res = await getTrendingDeck({faction: deck.faction, create_time: deck.create_time})
    if(res.count) {
        // update
        console.log('卡组已存在，准备更新！')
        res = await putTrendingDeck(res.results[0].id, deck)
        console.log('更新trending卡组完毕:', deck.deck_name, deck.deck_id)
    } else {
        // insert
        console.log('卡组不存在，准备添加！')
        res = await postTrendingDeck(deck)
        console.log('添加trending卡组完毕:', deck.deck_name, deck.deck_id)
    }
}

async function updateDecks(deck) {
    console.log('上传更新卡组！！！')
    var res = await getDeckDetail({deck_id: deck.deck_id})
    if(res.count) {
        // update
        console.log('卡组已存在，准备更新！')
        res = await updateDeck(res.results[0].id, deck)
        console.log('更新decks卡组完毕:', deck.deck_name, deck.deck_id)
    } else {
        // insert
        console.log('卡组不存在，准备添加！')
        res = await addDeck(deck)
        console.log('添加decks卡组完毕:', deck.deck_name, deck.deck_id)
    }
}

async function updateMetaArchetype(item) {
    console.log('上传更新卡组！！！')
    var res = await getMetaData({
        faction: item.faction, 
        archetype: item.archetype, 
        rank_range:item.rank_range, 
        create_time: dateFormat("YYYY-mm-dd", new Date())})
    if(res.count) {
        // update
        console.log('meta已存在，准备更新！')
        res = await updateMetaData(res.results[0].id, item)
        console.log('meta更新完毕:', item.archetype)
    } else {
        // insert
        console.log('meta不存在，准备添加！')
        res = await addMetaData(item)
        console.log('meta添加完毕:', item.archetype)
    }
}
function updateMetaArchetype1(item) {
    return new Promise(resolve => {
        getMetaData({
            faction: item.faction, 
            archetype: item.archetype, 
            rank_range:item.rank_range, 
            create_time: dateFormat("YYYY-mm-dd", new Date())
        }).then(res => {
            if(res.count) {
                console.log('meta已存在，准备更新！')
                updateMetaData(res.results[0].id, item).then(res => {
                    console.log('meta更新完毕:', item.archetype)
                    resolve(res)
                })
            } else {
                console.log('meta不存在，准备添加！')
                addMetaData(item).then(res => {
                    console.log('meta添加完毕:', item.archetype)
                    resolve(res)
                })
            }
        })
    })
}

function handleTierListItem(range, obj, text) {
    return new Promise(resolve => {
        var popularity1 = 0
        var game_count = 0
        sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
            mode: current_mode, 
            text: text+' 获取meta信息'
        }})
        getMetaData({
            faction: obj.faction, 
            archetype: obj.archetype_name,
            rank_range: range, 
            create_time: dateFormat("YYYY-mm-dd", new Date())
        }).then(async meta => {
            if (meta.count>0) {
                var meta_detail = meta.results[0]
                popularity1 = parseFloat(meta_detail.popularity)
                game_count = parseInt(meta_detail.games)
            }
            var data = {
                'tier': firstUpperCase(obj.tier),
                'archetype_name': obj.archetype_name,
                'faction': obj.faction,
                'win_rate': obj.win_rate,
                'popularity1': popularity1,
                'game_count': game_count,
                'rank_range': range,
                'update_time': dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
            }
            sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                mode: current_mode, 
                text: text+' 检查是否存在'
            }})
            var archetype = await getArchetype({archetype_name: obj.archetype_name, 
                rank_range: range, update_time:  dateFormat("YYYY-mm-dd", new Date()) })
            if (archetype.count) {
                console.log('archetype已存在，准备更新！')
                sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                    mode: current_mode, 
                    text: text+' 已存在，开始更新！'
                }})
                updateArchetype(archetype.results[0].id, data).then(res => {
                    console.log('archetype更新完毕:', obj.archetype_name)
                    resolve(res)
                })
                // res = await updateArchetype(archetype.results[0].id, data)
                // console.log('archetype更新完毕:', obj.archetype_name)
            } else {
                console.log('archetype不存在，准备添加！')
                sendMessageToPopup({msg: POP_MSG_ID.MSG_UPDATE_INFO_TEXT, payload: {
                    mode: current_mode, 
                    text: text+' 不存在，开始添加！'
                }})
                addArchetype(data).then(res => {
                    console.log('archetype添加完毕:', obj.archetype_name)
                    resolve(res)
                })
                // res = await addArchetype(data)
                // console.log('archetype添加完毕:', obj.archetype_name)
            }
        })
    })
}