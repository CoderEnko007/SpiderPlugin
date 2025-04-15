document.addEventListener('DOMContentLoaded', async function() {
    console.log('content-script:', location)
    // sleep(1000)
    // 这里好像会影响popup接收的消息
    var current_mode = await asyncSendMessageToBackground({msg:MSG_ID.MSG_GET_CURRENT_MODE, payload: null})
    console.log('当前脚本模式current_mode:', current_mode)
    if (current_mode.payload == MODE_ID.MODE_NONE) return
    var href = location.href
    var hash = location.hash
    var pathname = location.pathname
    console.log('=============DOMContentLoaded=============')
    var decks_reg = /\/decks\/(.*)\//
    var deck_detail_flag = decks_reg.test(pathname)
    var archetype_reg = /\/archetypes\/(.*)\//
    var archetype_detail_flag = archetype_reg.test(pathname)
    console.log(hash, pathname, pathname.split('/').indexOf('decks'))
    if (deck_detail_flag && hash.length && (pathname&&pathname.split('/').indexOf('decks')>0)) {
        var timer_times = 0
        var timer = window.setInterval(function() {
            sleep(1000)
            var overview_block = document.querySelectorAll('table.table-striped tbody tr')
            var deck_name_container = document.querySelector('.archetype-image-container h1')
            var wild_flag = hash.indexOf('RANKED_WILD')>0
            var twist_flag = hash.indexOf('RANKED_TWIST')>0
            timer_times += 1
            console.log('debug:', wild_flag, deck_name_container||wild_flag||twist_flag, overview_block.length&&(deck_name||wild_flag))
            if ((overview_block.length&&(deck_name_container||wild_flag||twist_flag)) || timer_times >= 15) {
                clearInterval(timer)
                var deck_id = location.pathname.match(/\/.*\/(.*)\//)[1]

                var deck_name = document.querySelector('title').textContent
                // 2024/10/14 部分三王子卡组无法正常加载
                // if (deck_name.indexOf('found')>=0 || deck_name.indexOf('Internal server error')) {
                if (deck_name.indexOf('found')>=0) {
                    sendMessageToBackground({msg: BG_MSG_ID.MSG_UPDATE_DECK, payload: {deck_id: deck_id, deck_name: 'invalid'}})
                    return
                }
                const [_, name] = deck_name.match(/(.*) - .*/) || [null, deck_name];
                // 处理职业名称
                let factionMap = {
                    'Demonhunter': 'Demon Hunter',
                    'Deathknight': 'Death Knight'
                };
                deck_name = factionMap[name] || name;

                // 获取卡组代码
                const deck_code_item = document.querySelector('meta[property="x-hearthstone:deck:deckstring"]');
                const deck_code = deck_code_item?.getAttribute('content') || '';
                console.log('卡组代码deck_code:', deck_code);

                // 获取实际游戏场次
                const last_section = document.querySelector('.infobox section:last-child');
                const game_count = last_section?.querySelector('.infobox-descriptionlist--item dd')?.textContent || '0';
                const real_game_count = parseInt(game_count.replace(/,/g, '')) || 0;

                const card_list_items = document.querySelectorAll('#overview .card-list-wrapper .card-list .card-tile');
                const card_list = Array.from(card_list_items).map(item => {
                    const getTextContent = selector => item.querySelector(selector)?.textContent || '';
                    const getAttribute = (selector, attr) => item.querySelector(selector)?.getAttribute(attr) || '';
                    
                    const card_cost = parseInt(getTextContent('span.card-cost'));
                    const card_asset = getAttribute('div.card-frame img.card-asset', 'src');
                    const card_hsid = card_asset.match(/\/([^\/]+)\.[a-zA-Z]*$/)?.[1] || '';
                    const card_count = parseInt(getTextContent('.card-count')) || 1;
                    const card_name = getTextContent('.card-name');
                    
                    return {
                        name: card_name,
                        cost: card_cost,
                        count: card_count,
                        card_hsid: card_hsid
                    };
                });

                const sideboards_list_items = document.querySelectorAll('#overview .card-list-wrapper .sideboard-list');
                const sideboards = [];

                const getCardInfo = (item) => {
                    const getTextContent = selector => item.querySelector(selector)?.textContent || '';
                    const getAttribute = (selector, attr) => item.querySelector(selector)?.getAttribute(attr) || '';
                    
                    const card_cost = parseInt(getTextContent('span.card-cost'));
                    const card_asset = getAttribute('div.card-frame img.card-asset', 'src');
                    const card_hsid = card_asset.match(/\/([^\/]+)\.[a-zA-Z]*$/)?.[1] || '';
                    const card_count = parseInt(getTextContent('.card-count')) || 1;
                    const card_name = getTextContent('.card-name');
                    
                    return { card_cost, card_asset, card_hsid, card_count, card_name };
                };

                for (const list_item of sideboards_list_items) {
                    const sideboards_items = list_item.querySelectorAll('.card-tile');
                    const sidelist_title = list_item.querySelector('span').textContent;
                    
                    if (sidelist_title === 'E.T.C.\'s Band') {
                        for (const item of sideboards_items) {
                            const { card_cost, card_hsid, card_count, card_name } = getCardInfo(item);
                            sideboards.push({
                                name: card_name,
                                cost: card_cost,
                                count: card_count,
                                card_hsid: card_hsid,
                                card_owner: 'ETC_080',
                                sideboard_title: '精英牛头人酋长的乐队'
                            });
                        }
                    } else {
                        var sideboard_title = '额外组件'
                        if (sidelist_title == 'Zilliax\'s Components') {
                            sideboard_title = '奇利亚斯的模块'
                            sideboards.push({'name': 'Zilliax Deluxe 3000', 'cost': 0, 'count': 1, 'card_hsid': 'TOY_330t5', 'card_owner': 'TOY_330', 'sideboard_title': sideboard_title})
                        }
                        for(var item of sideboards_items) {
                            var card_cost = parseInt(item.querySelector('span.card-cost').textContent)
                            var card_asset = item.querySelector('div.card-frame img.card-asset').getAttribute('src')
                            var card_hsid = card_asset.match(/.*\/(.*)\.[a-zA-Z]*$/)[1]
                            var card_count = 1
                            var card_name = item.querySelector('.card-name').textContent
                            var card_owner = card_hsid.match(/([a-zA-Z]*_[0-9]*)/)[1]
                            sideboards.push({'name': card_name, 'cost': card_cost, 'count': card_count, 'card_hsid': card_hsid, 'card_owner': card_owner, 'sideboard_title': sideboard_title})
                        }
                    }
                }
                // var sideboards_items = document.querySelectorAll('#overview .card-list-wrapper .sideboard-list .card-tile')
                // var sideboards = []
                // for(var item of sideboards_items) {
                //     var card_cost = parseInt(item.querySelector('span.card-cost').textContent)
                //     var card_asset = item.querySelector('div.card-frame img.card-asset').getAttribute('src')
                //     var card_hsid = card_asset.match(/.*\/(.*)\.[a-zA-Z]*$/)[1]
                //     var card_count = 1
                //     var card_name = item.querySelector('.card-name').textContent
                //     var card_owner = card_hsid.match(/([a-zA-Z]*_[0-9]*)/)[1]
                //     sideboards.push({'name': card_name, 'cost': card_cost, 'count': card_count, 'card_hsid': card_hsid, 'card_owner': card_owner})
                // }
                // if(sideboards.length>0 && sideboards[0].card_owner == 'TOY_330') {
                //     sideboards.unshift({'name': 'Zilliax Deluxe 3000', 'cost': 0, 'count': 1, 'card_hsid': 'TOY_330t5', 'card_owner': 'TOY_330'})
                // }

                // 获取回合数和持续时间
                const table_field = document.querySelectorAll('table.table-striped tbody tr');
                let turns = 0, duration = 0;
                if (table_field.length) {
                    const getCellValue = (row, col) => parseFloat(table_field[row]?.querySelectorAll('td')[col]?.textContent || 0);
                    turns = getCellValue(1, 1);
                    duration = getCellValue(0, 1);
                }

                // 获取整体胜率
                const win_rate_cell = document.querySelector('table.table-striped tbody tr td.winrate-cell');
                const real_win_rate = parseFloat(win_rate_cell?.textContent.replace('%', '') || 0);

                const win_rate_nodes = document.querySelectorAll('table.table-striped tbody tr')
                let faction_win_rate = []
                factionMap = {
                    'DEMONHUNTER': 'DemonHunter',
                    'DEATHKNIGHT': 'DeathKnight'
                };
                if (win_rate_nodes.length) {
                    for(var i=4; i<win_rate_nodes.length; i++) {
                        const item = win_rate_nodes[i]
                        const faction_str = item.querySelector('td span.player-class')?.getAttribute('class') || ''
                        let faction = faction_str.match(/.* (\w*)$/)?.[1] || ''
                        faction = factionMap[faction.toUpperCase()] || firstUpperCase(faction);
                        var win_rate = item.querySelector('td.winrate-cell').textContent
                        win_rate = parseFloat(win_rate.replace(/[^0-9.]/ig,""))
                        faction_win_rate.push({'faction': faction, 'win_rate': win_rate})
                    }
                }
                faction_win_rate = JSON.stringify(faction_win_rate)

                // 获取尘花费
                const dust_cost_field = document.querySelectorAll('.infobox .infobox-descriptionlist .infobox-descriptionlist--item');
                let dust_cost = 0;
                if (dust_cost_field.length) {
                    const dustItem = Array.from(dust_cost_field).find(item => 
                        item.textContent.includes('Dust')
                    );
                    dust_cost = dustItem ? parseInt(dustItem.textContent.replace(/\D+/g, '')) : 0;
                }

                // 确定游戏模式
                const rank_mode = 
                    hash.includes('RANKED_WILD') ? 'Wild' :
                    hash.includes('RANKED_TWIST') ? 'Twist' : 'Standard';

                var mulligan_block = document.querySelector("#page-content a[data-key='mulligan-guide']")
                var mulligan_flag = !!mulligan_block
                var deck = {
                    deck_id: deck_id,
                    deck_name: deck_name,
                    deck_code: deck_code,
                    real_game_count: real_game_count,
                    card_list: card_list,
                    sideboards: sideboards,
                    turns: turns,
                    real_win_rate: real_win_rate,
                    faction_win_rate: faction_win_rate,
                    matchups: [],
                    mode: rank_mode,
                    mulligan_flag: mulligan_flag,
                    dust_cost: dust_cost,
                    duration: duration,
                    last_30_days: false
                }

                const isNoDataMessage = (messageElement) => {
                    const noDataMessages = [
                        'No available data',
                        'Could not load data. Please check back later.'
                    ];
                    return noDataMessages.includes(messageElement?.textContent);
                };                
                var matchups_block = document.querySelector("#page-content a[data-key='matchups']")
                if(matchups_block) {
                    console.log('点击 matchup 按钮')
                    matchups_block.click()

                    let faction_boxes = [], 
                        messageElement = null,
                        matchups_timer_times = 0,
                        matchup = initializeMatchupObject();

                    const matchups_timer = window.setInterval(() => {
                        faction_boxes = document.querySelectorAll('div.class-box-container div.box.class-box')
                        messageElement = document.querySelector('h3.message-wrapper[aria-busy="true"]')
                        matchups_timer_times += 1
                        console.log('检查 matchup box是否存在：', timer_times, faction_boxes, matchups_timer_times)
                        
                        if (faction_boxes.length===0 && isNoDataMessage(messageElement)) {
                            console.log('matchup No available data')
                            clearInterval(matchups_timer)
                            matchups_timer_times = 0
                            handleMulliganCheck(mulligan_flag, mulligan_block, deck)
                        } else if (faction_boxes.length || matchups_timer_times >= 10) {
                            clearInterval(matchups_timer)
                            
                            // 提取数据处理逻辑
                            processFactionData(faction_boxes, matchup)                   
                            
                            // 统一JSON序列化处理
                            const matchup_value = JSON.stringify(Object.values(matchup))
                            deck.matchups = matchup_value
                            console.log('matchups 数据就绪:', matchup_value)

                            // 提取mulligan处理逻辑
                            handleMulliganCheck(mulligan_flag, mulligan_block, deck)
                        }  
                    }, 2000)                   
                } else {
                    handleMulliganCheck(mulligan_flag, mulligan_block, deck)     
                }   
            }
            console.log('定时器次数：', timer_times, deck)
        }, 1000)
    // } else if (pathname === '/analytics/query/single_deck_mulligan_guide_v2/') {
    } else if (pathname === '/api/v1/mulligan/') {
        var deck_id = href.match(/.*shortid=([0-9A-Za-z]*).*$/)[1]
        console.log('mulligan_guide deck_id:', deck_id)
        var mulligan_block = document.querySelector('pre')
        var mulligan = []
        if (mulligan_block) {
            mulligan = JSON.parse(mulligan_block.textContent)
            mulligan = mulligan.ALL.cards_by_dbf_id
            for (var item of mulligan) {
                for (var key in item) {
                    if (!item[key]) {
                        item[key]=0
                    }
                }
            }
        }
        var deck = {
            deck_id: deck_id,
            mulligan: mulligan
        }
        console.log('content-script解析mulligan完毕', mulligan)
        sendMessageToBackground({msg: BG_MSG_ID.MSG_HANDLE_MULLIGAN, payload: deck})
    } else if (archetype_detail_flag) {
        // 解析卡组模板页面
        var timer_times = 0
        var timer = window.setInterval(function() {
            var name_block = document.querySelector('.archetype-image-container h1')
            var winrate_block = document.querySelector('a.winrate-box .box-content')
            var winrate_block_flag = winrate_block && winrate_block.textContent.length>0
            // var real_games_block = document.querySelector('a.winrate-box .box-content h3')
            var popularity_block = document.querySelector('a.popularity-box .box-content')
            var popularity_block_flag = popularity_block && popularity_block.textContent.length>0
            var deck_block = document.querySelectorAll('a.deck-box .box-content')
            var deck_block_flag = deck_block.length>1 && deck_block[0].textContent.length>0 && deck_block[1].textContent.length>0
            var matchup_block = document.querySelectorAll('a.matchup-box .box-content')
            var matchup_block_flag = matchup_block.length>1 && !!matchup_block[0].textContent?.length && !!matchup_block[1].textContent?.length
            var archetype_block = document.querySelector('.archetype-signature')
            if (((name_block&&name_block.textContent) && winrate_block_flag && popularity_block_flag && popularity_block && deck_block_flag
                 && matchup_block_flag && archetype_block && timer_times>0) || timer_times>15) {
                clearInterval(timer)
                var archetype = {}
                var faction = firstUpperCase(document.querySelector('#archetype-container').getAttribute('data-archetype-player-class'))
                const factionMap = {
                    'Demonhunter': 'DemonHunter',
                    'Deathknight': 'DeathKnight'
                };
                archetype['faction'] = factionMap[faction] || faction;
                archetype['archetype'] = name_block.textContent
                
                var winrate = winrate_block.querySelector('h1')
                archetype['real_winrate'] = winrate ? parseFloat(winrate.textContent.replace('%', '')) : 0;
                
                const real_games = winrate_block.querySelector('h3');
                archetype['real_games'] = real_games ? parseInt(real_games.textContent.replace(/[^0-9]/ig,"")) : 0;
                
                const popularity = popularity_block.querySelector('h1');
                archetype['faction_popularity'] = popularity ? parseFloat(popularity.textContent.replace('%', '')) : 0;

                archetype['best_matchup'] = '[]'
                archetype['worst_matchup'] = '[]'
                archetype['pop_deck'] = '[]'
                archetype['best_deck'] = '[]'
                if (matchup_block.length>1) {
                    if (matchup_block[0].querySelector('span.player-class') && matchup_block[0].querySelectorAll('div.stats-table tr')) {
                        var best_matchup_player_class = matchup_block[0].querySelector('span.player-class').textContent
                        var best_matchup_faction = matchup_block[0].querySelector('span.player-class').getAttribute('class').split(' ')[1]
                        best_matchup_faction = firstUpperCase(best_matchup_faction)
                        if (best_matchup_faction == 'Demonhunter') {
                            best_matchup_faction = 'DemonHunter'
                        } else if (best_matchup_faction == 'Deathknight') {
                            best_matchup_faction = 'DeathKnight'
                        }
                        var matchup_box_tr = matchup_block[0].querySelectorAll('div.stats-table tr')
                        if (matchup_box_tr.length > 1) {
                            var best_matchup_win_rate = matchup_box_tr[0].querySelector('td').textContent
                            var best_matchup_games = matchup_box_tr[1].querySelector('td').textContent
                            archetype['best_matchup'] = JSON.stringify([best_matchup_player_class, best_matchup_win_rate, best_matchup_games, best_matchup_faction])
                        }
                    } else {
                        console.log('best match up为空')
                    }
                    if (matchup_block[1].querySelector('span.player-class') && matchup_block[1].querySelectorAll('div.stats-table tr')) {
                        var worst_matchup_player_class = matchup_block[1].querySelector('span.player-class').textContent
                        var worst_matchup_faction = matchup_block[1].querySelector('span.player-class').getAttribute('class').split(' ')[1]
                        worst_matchup_faction = firstUpperCase(worst_matchup_faction)
                        if (worst_matchup_faction == 'Demonhunter') {
                            worst_matchup_faction = 'DemonHunter'
                        } else if (worst_matchup_faction == 'Deathknight') {
                            worst_matchup_faction = 'DeathKnight'
                        }
                        var matchup_box_tr = matchup_block[1].querySelectorAll('div.stats-table tr')
                        if (matchup_box_tr.length > 1) {
                            var worst_matchup_win_rate = matchup_box_tr[0].querySelector('td').textContent
                            var worst_matchup_games = matchup_box_tr[1].querySelector('td').textContent
                            archetype['worst_matchup'] = JSON.stringify([worst_matchup_player_class, worst_matchup_win_rate, worst_matchup_games, worst_matchup_faction])
                        }
                    } else {
                        console.log('worst matchup为空')
                    }
                } else {
                    console.log('matchup_box 无内容')
                }
                if (deck_block.length>1) {
                    var deck_boxes = document.querySelectorAll('a.deck-box')
                    var deck_code_reg = /.*\/(.*)\//
                    var pop_deck_href = deck_boxes[0].getAttribute('href')
                    if (pop_deck_href) {
                        var pop_deck_code = deck_code_reg.exec(pop_deck_href)[1]
                        var pop_deck_win_rate = deck_boxes[0].querySelectorAll('div.stats-table tr')[0].querySelector('td').textContent
                        var pop_deck_games = deck_boxes[0].querySelectorAll('div.stats-table tr')[1].querySelector('td').textContent
                        archetype['pop_deck'] = JSON.stringify([pop_deck_code, pop_deck_win_rate, pop_deck_games])
                    } else {
                        console.log('pop deck为空')
                    }
                    var best_deck_href = deck_boxes[1].getAttribute('href')
                    if (best_deck_href) {
                        var best_deck_code = deck_code_reg.exec(best_deck_href)[1]
                        var best_deck_win_rate = deck_boxes[1].querySelectorAll('div.stats-table tr')[0].querySelector('td').textContent
                        var best_deck_games = deck_boxes[1].querySelectorAll('div.stats-table tr')[1].querySelector('td').textContent
                        archetype['best_deck'] = JSON.stringify([best_deck_code, best_deck_win_rate, best_deck_games])
                    } else {
                        console.log('best deck为空')
                    }
                } else {
                    console.log('deck_box 无内容')
                }
                archetype['core_cards'] = []
                archetype['pop_cards'] = []
                var card_list_wrapper = document.querySelectorAll('div.archetype-signature div.card-list-wrapper')
                var core_card_list_items = card_list_wrapper.length>0?card_list_wrapper[0].querySelectorAll('.card-tile'):[]
                var core_cards = []
                for(var item of core_card_list_items) {
                    card_name = item.querySelector('.card-name').textContent
                    card_cost = item.querySelector('.card-cost').textContent
                    card_assert = item.querySelector('img.card-asset').getAttribute('src')
                    card_hsid = card_assert.match(/.*\/(.*)\.[a-zA-Z]*$/)[1]
                    core_cards.push({'name': card_name, 'cost': card_cost, 'card_hsid': card_hsid})
                }
                archetype['core_cards'] = core_cards

                var pop_card_list_items = card_list_wrapper.length>1?card_list_wrapper[1].querySelectorAll('.card-tile'):[]
                var pop_cards = []
                for(var item of pop_card_list_items) {
                    card_name = item.querySelector('.card-name').textContent
                    card_cost = item.querySelector('.card-cost').textContent
                    card_assert = item.querySelector('img.card-asset').getAttribute('src')
                    card_hsid = card_assert.match(/.*\/(.*)\.[a-zA-Z]*$/)[1]
                    pop_cards.push({'name': card_name, 'cost': card_cost, 'card_hsid': card_hsid})
                }
                archetype['pop_cards'] = pop_cards

                var tab_matchup = document.querySelector('#tab-matchups')
                tab_matchup.click()
                setTimeout(function() {
                    var faction_boxes = document.querySelectorAll('div.class-box-container div.box.class-box')
                    var matchup = {'Druid':[], 'Hunter':[], 'Mage':[], 'Paladin':[], 'Priest':[], 'Rogue':[], 'Shaman':[], 'Warlock':[], 'Warrior':[], 'DemonHunter':[], 'DeathKnight':[]}
                    for (var box of faction_boxes) {
                        var faction = box.querySelector('div.box-title span.player-class').textContent.replace(' ', '')
                        var archetype_list_block = box.querySelectorAll('div.grid-container')[2].querySelectorAll('a.player-class')
                        var archetype_list = []
                        for (var arche of archetype_list_block) {
                            archetype_list.push([arche.textContent])
                        }
                        var data_cells_block = box.querySelectorAll('div.grid-container')[3].querySelectorAll('a.table-cell')
                        data_list = []
                        list_temp = []
                        for(var i=0; i<data_cells_block.length; i++) {
                            list_temp.push(data_cells_block[i].textContent)
                            if (list_temp.length % 3 == 0) {
                                data_list.push(list_temp)
                                list_temp = []
                            }
                        }
                        for (var i=0; i<archetype_list.length; i++) {
                            archetype_list[i].push.apply(archetype_list[i], data_list[i])
                        }
                        matchup[faction] = archetype_list
                    }
                    var matchup_value = []
                    for (var key in matchup) {
                        matchup_value.push(matchup[key])
                    }
                    matchup_value = JSON.stringify(matchup_value)
                    archetype['matchup'] = matchup_value
                    console.log('archetype解析完毕：', archetype)
                    sendMessageToBackground({msg: BG_MSG_ID.MSG_UPDATE_META_BY_CLASS, payload: archetype})
                }, 3000)
            }
            timer_times += 1
            console.log('定时器次数：', timer_times)
        }, 2000)
    } else if (current_mode.payload == MODE_ID.MODE_TIER_LIST) {
        sendMessageToBackground({msg: BG_MSG_ID.TIER_LIST_PAGE_LOADED, payload: null})
    } else if (current_mode.payload == MODE_ID.MODE_META_BY_CLASS_ALL) {
        sendMessageToBackground({msg: BG_MSG_ID.MSG_META_PAGE_LOADED, payload: null})
    } else if (current_mode.payload == MODE_ID.MODE_RANK) {
        // var game_type = {'Standard': 2, 'Wild': 30, 'Arena': 3}
        // var game_type = [{name: 'Standard', value: 2}, {name: 'Wild', value: 30}, 
        //                  {name: 'Arena', value: 3}, {name: 'Duels', value: 55}, {name: 'Classic', value: 58}, {name: 'Classic', value: 63}]
        var json_str = document.querySelector('pre').textContent
        var json_data = JSON.parse(json_str).series.data
        var rank_list = []
        var game_mode_list = [{name: 'Standard', value: 'BGT_RANKED_STANDARD'}, {name: 'Wild', value: 'BGT_RANKED_WILD'}, 
            {name: 'Arena', value: 'BGT_ARENA'}, {name: 'Twist', value: 'BGT_RANKED_TWIST'}]
        game_mode_list.forEach((game_mode) => {
            var faction_data_list = json_data[game_mode['value']]
            for ( faction in faction_data_list) {
                var format_faction
                if (faction.toUpperCase() == 'DEMONHUNTER') {
                    format_faction = 'DemonHunter'
                } else if (faction.toUpperCase() == 'DEATHKNIGHT') {
                    format_faction = 'DeathKnight'
                } else {
                    format_faction = firstUpperCase(faction)
                }
                var rank_item = {
                    'faction': format_faction,
                    'game_type': game_mode['name'],
                    'win_rate': faction_data_list[faction].win_rate,
                    'date': dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
                }
                console.log(rank_item)
                rank_list.push(rank_item)
            }
        })
        sendMessageToBackground({msg: BG_MSG_ID.MSG_UPLOAD_RANK_DATA, payload: rank_list})
    } else {
        console.log(dateFormat("YYYY-mm-dd HH:MM:SS", new Date())+':页面未处理')
    }
})



chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    console.log('content-script收到消息：', request);
    var msg = request.msg
    var payload = request.payload
    switch(msg) {
        case CS_MSG_ID.MSG_ANALYSIS_TRENDING: {
            var objs = document.querySelectorAll('.deck-list>ul li .deck-tile');
            if (objs.length) {
                console.log('load complete!')
                var deck_list = analysis_deck_list_page(msg, objs, 0, objs.length)
                console.log('content-script解析完毕', deck_list)
                // 同时发给background和popup
                sendMessageToBackground({msg: MSG_ID.MSG_ANALYSIS_TRENDING, payload: deck_list})
            } else {
                alert('卡组列表还未加载')
            }
        };
        break;
        case CS_MSG_ID.MSG_ANALYSIS_DECKS_PAGE: {
            var objs = document.querySelectorAll('.deck-list>ul li .deck-tile');
            if (objs.length) {
                var deck_list = analysis_deck_list_page(msg, objs, 0, objs.length)
                sendMessageToBackground({msg: MSG_ID.MSG_ANALYSIS_DECKS, payload: deck_list})
            } else {
                alert('卡组列表还未加载')
            }
        };
        break;
        case CS_MSG_ID.MSG_ANALYSIS_DECKS_PAGE_V2: {
            console.log('MSG_ANALYSIS_DECKS_PAGE_V2')
            var json_deck_data = JSON.parse(document.querySelectorAll('pre')[0].textContent).series.data
            
            var deck_list = analysis_deck_list_page_v2(payload.rank_mode, payload.rank_range, payload.include_cards, payload.start_num, payload.end_num, json_deck_data)
            sendMessageToBackground({msg: MSG_ID.MSG_ANALYSIS_DECKS_V2, payload: deck_list})
        };
        break;
        case CS_MSG_ID.MSG_NEW_DECKS_PAGE: {
            var timer_times = 0
            var timer = window.setInterval(function() {
                // var deck_list_block = document.querySelectorAll('.deck-list>ul>li')
                var deck_list_block = objs = document.querySelectorAll('.deck-list>ul li .deck-tile');
                timer_times += 1
                console.log('第'+timer_times+'次查看卡组页是否加载完毕')
                if (deck_list_block.length) {
                    console.log('页面加载完成')
                    clearInterval(timer)
                    console.log(deck_list_block, deck_list_block.length)
                    var deck_list = analysis_deck_list_page(msg, deck_list_block, 0, deck_list_block.length)
                    sendMessageToBackground({msg: MSG_ID.MSG_ANALYSIS_DECKS, payload: deck_list})
                }
            }, 2000)
        };
        break;
        case CS_MSG_ID.MSG_ANALYSIS_META_BY_CLASS1: {
            var objs = document.querySelectorAll('div.class-box-container div.box.class-box')
            var filter_faction = payload.faction
            var rank_range = payload.rank_range[0]
            var list_array = {}
            for(var item of objs) {
                var faction = item.querySelector('div.box-title span.player-class').textContent
                faction = firstUpperCase(faction.replace(' ', ''))
                if (faction == 'Demonhunter') {
                    faction = 'DemonHunter'
                } else if (faction == 'Deathknight') {
                    faction = 'DeathKnight'
                }
                console.log(filter_faction, filter_faction.length, faction, filter_faction.indexOf(faction))
                if (filter_faction.length>0 && filter_faction.indexOf(faction)<0) {
                    continue
                }
                list_array[faction] = {}
                var archetype_list_block = item.querySelectorAll('div.grid-container')[2].querySelectorAll('a.player-class')
                var archetype_list = []
                for(var arche of archetype_list_block) {
                    archetype_list.push({faction: faction, archetype: arche.textContent, href: arche.getAttribute('href')})
                }
                var archetype_list_other_block = item.querySelectorAll('div.grid-container')[2].querySelector('span.player-class div.tooltip-wrapper h4')
                if (archetype_list_other_block) {
                    archetype_list.push({faction: faction, archetype: archetype_list_other_block.textContent, href:''})
                }
                var data_cells = item.querySelectorAll('div.grid-container')[3].querySelectorAll('.table-cell')
                var data_list = []
                var temp_list = []
                for(var i=0; i<data_cells.length; i++) {
                    temp_list.push(data_cells[i].textContent)
                    if (temp_list.length % 3 == 0) {
                        data_list.push(temp_list)
                        temp_list = []
                    }
                }
                for (var i=0; i<archetype_list.length; i++) {
                    var item = archetype_list[i]
                    item['winrate'] = parseFloat(data_list[i][0].replace('%', ''))
                    item['popularity'] = parseFloat(data_list[i][1].replace('%', ''))
                    item['games'] = parseInt(data_list[i][2].replace(',', ''))
                    item['rank_range'] = rank_range
                    item['checked'] = false
                    item['create_time'] = dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
                }
                list_array[faction] = archetype_list
            }
            console.log('meta数据抓取完毕', list_array)
            sendMessageToBackground({msg: MSG_ID.MSG_ANALYSIS_META_BY_CLASS, payload: {rank_range: rank_range, list: list_array}})
        };
        break;
        case CS_MSG_ID.MSG_ANALYSIS_META_BY_CLASS: {
            var rank_range = payload.range
            var filter_faction = payload.faction
            var rank_range_buttons = get_rank_range_button()
            var current_range_block = rank_range_buttons.filter(item => {
                if (item.range == rank_range) {
                    return item.block
                }
            })[0].block
            console.log(current_range_block, filter_faction)
            current_range_block.click()
            var timer_times = 0
            var timer = window.setInterval(function() {
                var objs = document.querySelectorAll('div.class-box-container div.box.class-box')
                timer_times += 1
                console.log('第'+timer_times+'次查看页面是否加载完毕')
                if (objs.length) {
                    clearInterval(timer)
                    var list_array = {}
                    for(var item of objs) {
                        var faction = item.querySelector('div.box-title span.player-class').textContent
                        faction = firstUpperCase(faction.replace(' ', ''))
                        if (faction == 'Demonhunter') {
                            faction = 'DemonHunter'
                        } else if (faction == 'Deathknight') {
                            faction = 'DeathKnight'
                        }
                        console.log(filter_faction, filter_faction.length, faction, filter_faction.indexOf(faction))
                        if (filter_faction.length>0 && filter_faction.indexOf(faction)<0) {
                            continue
                        }
                        list_array[faction] = {}
                        var archetype_list_block = item.querySelectorAll('div.grid-container')[2].querySelectorAll('a.player-class')
                        var archetype_list = []
                        for(var arche of archetype_list_block) {
                            archetype_list.push({faction: faction, archetype: arche.textContent, href: arche.getAttribute('href')})
                        }
                        var archetype_list_other_block = item.querySelectorAll('div.grid-container')[2].querySelector('span.player-class div.tooltip-wrapper h4')
                        if (archetype_list_other_block) {
                            archetype_list.push({faction: faction, archetype: archetype_list_other_block.textContent, href:''})
                        }
                        var data_cells = item.querySelectorAll('div.grid-container')[3].querySelectorAll('.table-cell')
                        var data_list = []
                        var temp_list = []
                        for(var i=0; i<data_cells.length; i++) {
                            temp_list.push(data_cells[i].textContent)
                            if (temp_list.length % 3 == 0) {
                                data_list.push(temp_list)
                                temp_list = []
                            }
                        }
                        for (var i=0; i<archetype_list.length; i++) {
                            var item = archetype_list[i]
                            item['winrate'] = parseFloat(data_list[i][0].replace('%', ''))
                            item['popularity'] = parseFloat(data_list[i][1].replace('%', ''))
                            item['games'] = parseInt(data_list[i][2].replace(',', ''))
                            item['rank_range'] = rank_range
                            item['checked'] = false
                            item['create_time'] = dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
                        }
                        list_array[faction] = archetype_list
                    }
                    console.log('meta数据抓取完毕', list_array, rank_range)
                    sendMessageToBackground({msg: MSG_ID.MSG_ANALYSIS_META_BY_CLASS, payload: {rank_range: rank_range, list: list_array}})
                }
            }, 2000)
        };
        break;
        case CS_MSG_ID.MSG_UPDATE_TIER_LIST: {
            console.log('准备解析TierList', msg, payload)
            var rank_range = payload.range
            var rank_range_buttons = get_rank_range_button()
            var current_range_block = rank_range_buttons.filter(item => {
                console.log(item, item.range, rank_range)
                if (item.range == rank_range) {
                    return item.block
                }
            })[0].block
            console.log(current_range_block)
            current_range_block.click()
            var timer_times = 0
            var timer = window.setInterval(function() {
                var tier_list_block = document.querySelectorAll('div.archetype-tier-list div.tier')
                timer_times += 1
                console.log('第'+timer_times+'次查看页面是否加载完毕')
                if (tier_list_block.length) {
                    console.log('页面加载完成')
                    clearInterval(timer)
                    console.log(tier_list_block, tier_list_block.length)
                    var tier_list = []
                    for (var item of tier_list_block) {
                        var tier = item.querySelector('div.tier-header').innerText.split('\n')[0]
                        var archetype_list_items = item.querySelectorAll('li.archetype-list-item')
                        for (var arche of archetype_list_items) {
                            var archetype_name = arche.querySelector('div.archetype-name').textContent
                            var faction = archetype_name.split(' ')
                            if (faction.length>2 && faction[faction.length-2].toLowerCase()=='demon') {
                                faction = 'DemonHunter'
                            } else if (faction.length>2 && faction[faction.length-2].toLowerCase()=='death') {
                                faction = 'DeathKnight'
                            } else {
                                faction = faction[faction.length-1]
                                if (faction == 'Handlock') {
                                    faction = 'Warlock'
                                }
                            }
                            var win_rate = parseFloat(arche.querySelector('div.archetype-data').textContent)
                            var arche_obj = {
                                'tier': tier,
                                'archetype_name': archetype_name,
                                'faction': faction,
                                'win_rate': win_rate,
                                'rank_range': rank_range,
                                'update_time': dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
                            }
                            tier_list.push(arche_obj)
                        }
                    }
                    console.log('aaaaa', tier_list)
                    sendMessageToBackground({msg: BG_MSG_ID.MSG_ANALYSIS_TIER_END, payload: {range: rank_range, list: tier_list}})
                }
            }, 2000)
        };
        break;
        default: {
            if (sendResponse) {
                console.log('未知消息')
                sendResponse('未知消息')
            }
        }
    }
});

function sendMessageToBackground(message) {
	chrome.runtime.sendMessage(message, function(response) {
		console.log('收到background或者popup回复：', response);
	});
}

function asyncSendMessageToBackground(message) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage(message, function(response) {
            console.log('收到background或者popup回复：', response);
            resolve(response)
        });
    })
}

function analysis_deck_list_page(msg, objs, start, end) {
    var deck_list = []
    console.log('analysis_deck_list_page', start, end)
    for (var i=start; i<end; i++) {
        var item = objs[i]
        var deck_item = item
        var href = deck_item.getAttribute('href')
        var deck_id = href.match(/\/.*\/(.*)\//)[1]
        var faction = deck_item.getAttribute('data-card-class')
        if(faction === 'DEMONHUNTER') {
            faction = 'DemonHunter'
        } else if(faction === 'DEATHKNIGHT') {
            faction = 'DeathKnight'
        } else {
            faction = firstUpperCase(faction)
        }
        var deck_name = item.querySelector('.row h3.deck-name').textContent
        var dust_cost = dust_cost = parseInt(item.querySelector('.row .dust-cost').textContent.replace(',', ''))
        var win_rate = item.querySelector('.row .win-rate').textContent
        win_rate = parseFloat(win_rate.replace('%', ''))
        var duration = item.querySelector('.row .duration').textContent
        duration = parseFloat(duration.trim().split(' ')[0])
        var game_count = item.querySelector('.row .game-count').textContent
        game_count = parseInt(game_count.replace(',', ''))
        var url
        var reg_str = /.*\/#.*/ //是否有#号存在
        if (reg_str.test(href)) {
            url = 'https://hsreplay.net'+href+'&tab=overview'
        } else {
            url = 'https://hsreplay.net'+href+'#tab=overview'
        }
        // trending卡组调整为钻石-传说分段
        if (msg == CS_MSG_ID.MSG_ANALYSIS_TRENDING) {
            // url = 'https://hsreplay.net'+href+'&rankRange=DIAMOND_THROUGH_LEGEND&tab=overview'
            // 版本初期临时调整为青铜分段
            url = 'https://hsreplay.net'+href+'&rankRange=BRONZE_THROUGH_GOLD&tab=overview'
        }
        
        deck_list.push({
            deck_id: deck_id,
            faction: faction,
            url: url,
            deck_name: deck_name,
            dust_cost: dust_cost,
            win_rate: win_rate,
            duration: duration,
            game_count: game_count,
            handled_flag: false
        })
    }
    console.log('deck_list解析完毕', deck_list)
    return deck_list
}

function analysis_deck_list_page_v2(game_type, rank_range, include_cards, start, end, objs) {
    console.log('analysis_deck_list_page_v2', game_type, rank_range, include_cards, start, end, objs)
    var deck_list = []

    for (let faction in objs) {
        console.log(faction, objs[faction].length)
        for (let item of objs[faction]) {
            console.log(include_cards, item)
            
            if (include_cards.length>0) {
                // 获取卡组中的卡牌列表并格式化成一级数组
                var card_list = JSON.parse(item.deck_list)
                var temp_card_list = card_list.map(subArray => subArray[0])
                // 检查卡组中是否含有include_cards中包含的卡牌，没有的话跳出循环
                function containsAny(arr1, arr2) {
                    return arr2.some(element => arr1.includes(element));
                }
                var result = containsAny(temp_card_list, include_cards)
                if (!result) {
                    continue
                }
            }

            var format_faction = faction
            if(format_faction === 'DEMONHUNTER') {
                format_faction = 'DemonHunter'
            } else if(format_faction === 'DEATHKNIGHT') {
                format_faction = 'DeathKnight'
            } else {
                format_faction = firstUpperCase(format_faction)
            }

            var deck_id = item.deck_id
            var url = 'https://hsreplay.net/decks/'+deck_id+'/#gameType='+game_type+'&rankRange='+rank_range+'&tab=overview'
            var duration = parseFloat((item.avg_game_length_seconds/60).toFixed(1))

            deck_list.push({
                deck_id: deck_id,
                faction: format_faction,
                url: url,
                win_rate: item.win_rate,
                duration: duration,
                game_count: item.total_games,
                handled_flag: false
            })
        }
    }
    deck_list.sort(function(a, b) {
        return b.game_count - a.game_count
    })
    // 临时，只获取130以后的卡组
    // deck_list = deck_list.slice(130)
    if (start>=0 && end>0 && end>start) {
        deck_list = deck_list.slice(start, end)
    }
    console.log('deck_list_v2解析完毕', deck_list)
    return deck_list
}

function analysis_tier_list_page(all_range_objs, current_range_obj, list_array, count) {
    var timer_times = 0
    var timer = window.setInterval(function() {
        var tier_list_block = document.querySelectorAll('div.archetype-tier-list div.tier')
        timer_times += 1
        console.log('第'+timer_times+'次查看页面是否加载完毕')
        if (tier_list_block.length) {
            console.log('页面加载完成')
            clearInterval(timer)
            console.log(tier_list_block, tier_list_block.length)
            var tier_list = []
            for (var item of tier_list_block) {
                var tier = item.querySelector('div.tier-header').innerText.split('\n')[0]
                var archetype_list_items = item.querySelectorAll('li.archetype-list-item')
                for (var arche of archetype_list_items) {
                    var archetype_name = arche.querySelector('div.archetype-name').textContent
                    var faction = archetype_name.split(' ')
                    if (faction.length>2 && faction[faction.length-2].toLowerCase()=='demon') {
                        faction = 'DemonHunter'
                    } else if (faction.length>2 && faction[faction.length-2].toLowerCase()=='death') {
                        faction = 'DeathKnight'
                    } else {
                        faction = faction[faction.length-1]
                        if (faction == 'Handlock') {
                            faction = 'Warlock'
                        }
                    }
                    var win_rate = parseFloat(arche.querySelector('div.archetype-data').textContent)
                    var arche_obj = {
                        'tier': tier,
                        'archetype_name': archetype_name,
                        'faction': faction,
                        'win_rate': win_rate,
                        'rank_range': current_range_obj.range,
                        'update_time': dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
                    }
                    tier_list.push(arche_obj)
                }
            }
            list_array.push({range: current_range_obj.range, list: tier_list})
            count += 1
            console.log('当前tierlist页面解析完毕：', list_array, current_range_obj)
            console.log('current_range_obj.range='+current_range_obj.range+', all_range_objs[all_range_objs.length-1]='+all_range_objs[all_range_objs.length-1].range)
            if (current_range_obj.range != all_range_objs[all_range_objs.length-1].range) {
                for (var i=0; i<all_range_objs.length; i++) {
                    if (all_range_objs[i].range == current_range_obj.range) {
                        current_range_obj = all_range_objs[i+1]
                        current_range_obj.block.click()
                    }
                    console.log('新的current_range_obj.range=', current_range_obj)
                    if (count < 2) {
                        analysis_tier_list_page(all_range_objs, current_range_obj, list_array) 
                    }
                }
            }
        }
    }, 2000)
}

function get_rank_range_button() {
    var rank_range_objs = []
    var selectable_item = document.querySelectorAll('#rank-range-filter li.selectable')
    for(var item of selectable_item) {
        if (item.innerText == 'Legend: Top 1,000') { rank_range_objs.push({block: item, range: 'TOP_1000_LEGEND'}) }
        else if (item.innerText == 'Legend') { rank_range_objs.push({block: item, range: 'LEGEND'}) }
        else if (item.innerText == 'Diamond: 4–1') { rank_range_objs.push({block: item, range: 'DIAMOND_FOUR_THROUGH_DIAMOND_ONE'}) }
        else if (item.innerText == 'Diamond through Legend') { rank_range_objs.push({block: item, range: 'DIAMOND_THROUGH_LEGEND'}) }
        else if (item.innerText == 'Bronze through Gold') { rank_range_objs.push({block: item, range: 'BRONZE_THROUGH_GOLD'}) }
    }
    return rank_range_objs
}

function initializeMatchupObject() {
    return {
        'Druid': [], 'Hunter': [], 'Mage': [], 'Paladin': [],
        'Priest': [], 'Rogue': [], 'Shaman': [], 'Warlock': [],
        'Warrior': [], 'DemonHunter': [], 'DeathKnight': []
    }
}

function processFactionData(faction_boxes, matchup) {
    for (const box of faction_boxes) {
        const faction = box.querySelector('div.box-title span.player-class').textContent.replace(' ', '')
        const [archetype_list, data_list] = extractBoxData(box)
        
        matchup[faction] = archetype_list.map((arche, index) => 
            arche.concat(data_list[index] || [])
        )
    }
}


function extractBoxData(box) {
    const archetype_list = Array.from(box.querySelectorAll('div.grid-container')[2]
        .querySelectorAll('a.player-class'))
        .map(arche => [arche.textContent])
    
    const data_cells = Array.from(box.querySelectorAll('div.grid-container')[3]
        .querySelectorAll('a.table-cell'))
        .map(cell => cell.textContent)
    
    const data_list = []
    for (let i = 0; i < data_cells.length; i += 3) {
        data_list.push(data_cells.slice(i, i + 3))
    }
    
    return [archetype_list, data_list]
}

function handleMulliganCheck(flag, block, deck) {
    if (!flag) {
        sendMessageToBackground({ msg: BG_MSG_ID.MSG_UPDATE_DECK, payload: deck })
        return
    }

    console.log('点击调度建议按钮')
    block.click()
    
    let mulligan_timer_times = 0
    const mulligan_timer = window.setInterval(() => {
        const guide = document.querySelector("#page-content .table-container")
        console.log('检查mulligan存在：', ++mulligan_timer_times, guide)
        
        if (guide || mulligan_timer_times >= 30) {
            clearInterval(mulligan_timer)
            deck.mulligan_flag = !!guide
            sendMessageToBackground({ msg: BG_MSG_ID.MSG_UPDATE_DECK, payload: deck })
        }
    }, 1000)
}
