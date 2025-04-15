// tablesID = {
//     'faction_rank': 139786, //59996,
//     'card_series': 51271,
//     'standard_decks': 139799, //53174,
//     'wild_decks': 139800, //55625,
//     'twist_decks': 139801, //117489,
//     'arena_cards': 70488,
//     'trending': 53120,//139753, //53120,
//     'winrate': 139823, //96629,
//     'winrate_detail': 139824, //56176
//     'archetype': 139874, //96648
//     'new_cards': 88786,
//     'activation_code': 90990
// }
tablesID = {
    'faction_rank': 59996,
    'card_series': 51271,
    'standard_decks': 53174,
    'wild_decks': 55625,
    'twist_decks': 117489,
    'arena_cards': 70488,
    'trending': 53120,
    'winrate': 96629,
    'winrate_detail': 56176,
    'archetype': 96648,
    'new_cards': 88786,
    'activation_code': 90990
}

const client_id = 'ec59002ba0fc4c74bf50'
const client_secret = 'bd7264a9542173aa188b650c1b76580e7d612355'
const code_url = "https://cloud.minapp.com/api/oauth2/hydrogen/openapi/authorize/"
const token_url = "https://cloud.minapp.com/api/oauth2/access_token/"
var token = null
var HSCards = null
var card_series = {}

// 假设要读取的 JSON 文件名为 cards.json
const jsonFilePath = '../cardsJSON/cards_hscards.json';

async function getAllCards() {
    if (HSCards) {
        return HSCards
    }
    try {
        const response = await fetch(jsonFilePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        var res = await response.json();
        HSCards = res.RECORDS;
        console.log(HSCards);
        return HSCards;
    } catch (error) {
        console.error('读取 JSON 文件时出错:', error);
    }
}

// getAllCards()

async function get_code() {
    var params = {
        'client_id': client_id,
        'client_secret': client_secret
    }
    var res = await fetch(code_url, {
        method: 'POST',
        body: JSON.stringify(params),
        mode: 'no-cors'
    })
    var jsonData = await res.json()
    return jsonData.code
}

async function get_token() {
    var code = await get_code()
    var params = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'authorization_code',
        'code': code
    }
    var res = await fetch(token_url, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {
            "content-type": "application/json",
        },
    })
    var jsonData = await res.json()
    return jsonData.access_token
}

async function get_table_data(tableID, query) {
    if (!token) {
        token = await get_token()
    }
    var base_url = 'https://cloud.minapp.com/oserve/v1/table/'+tableID+'/record/'
    var headers = {
        'Authorization': 'Bearer '+token
    }
    var url = base_url
    if (query) {
        var query_ = new URLSearchParams(query)
        url = base_url+'?'+query_
    }
    var res = await fetch(url, {
        method: 'GET',
        headers: headers
    })
    var jsonData = res.json()
    return jsonData
}

async function post_table_data(tableID, data) {
    if (!token) {
        token = await get_token()
    }
    var base_url = 'https://cloud.minapp.com/oserve/v1/table/'+tableID+'/record/'
    var headers = {
        'Authorization': 'Bearer '+token,
        'Content-type': 'application/json'
    }
    var res = await fetch(base_url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
    console.log('post_table_data', res)
    return res.json()
}

async function put_table_data(tableID, recordID, data) {
    if (!token) {
        token = await get_token()
    }
    var base_url = 'https://cloud.minapp.com/oserve/v1/table/'+tableID+'/record/'+recordID
    var headers = {
        'Authorization': 'Bearer '+token,
        'Content-type': 'application/json' 
    }
    var res = await fetch(base_url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data) 
    })
    console.log('put_table_data', res)
    return res.json()
}

async function get_card_series() {
    console.log('get_card_series')
    query = {
        'limit': 10000,
    }
    var res = await get_table_data(tablesID.card_series, query)
    res.objects.forEach(item => {
        card_series[item.ename] = item.setId
    })
    console.log('get_card_series end:', card_series) 
}
// get_card_series()

async function get_rank_data(msg) {
    console.log('get_rank_data:', msg)
    var query = {
        'where': JSON.stringify({
            "$and": [
                {"faction": {'$eq': msg.faction}},
                {"game_type": {'$eq': msg.game_type}}
            ]
        }),
        'limit': 1000
    }
    var res = await get_table_data(tablesID.faction_rank, query)
    console.log('get_rank_data end:', res)
    return {
        'count': res.meta.total_count,
        'results': res.objects
    }
}

async function post_rank_data(data) {
    console.log('post_rank_data:', data)
    data.report_time = dateFormat("YYYY-mm-dd", new Date())
    var res = await post_table_data(tablesID.faction_rank, data)
    console.log('post_rank_data end:', res) 
}

async function put_rank_data(recordID, data) {
    console.log('put_rank_data:', recordID, data)
    data.report_time = dateFormat("YYYY-mm-dd", new Date())
    var res = await put_table_data(tablesID.faction_rank, recordID, data)
    console.log('put_rank_data end:', res) 
}

async function get_trending_deck(msg) {
    console.log('get_trending_deck:', msg)
    var query = {
        'where': JSON.stringify({
            'faction': {'$eq': msg.faction}
        }),
        'limit': 1000
    }
    var res = await get_table_data(tablesID.trending, query)
    console.log('get_trending_deck end:', res)
    return {
        'count': res.meta.total_count,
        'results': res.objects
    }
}

function format_deck_data(data) {
    var card_list = data.card_list.length?data.card_list:[]
    var sideboards_list = data.sideboards.length?data.sideboards:[]
    var card_array = []
    // set_array需要先从知晓云获取扩展包的ID数据
    var set_array = []
    var clazzCount = {'MINION': 0, 'SPELL': 0, 'WEAPON': 0, 'HERO': 0, 'LOCATION': 0}
    var rarityCount = {'FREE': 0, 'COMMON': 0, 'RARE': 0, 'EPIC': 0, 'LEGENDARY': 0}
    var statistic = new Array(8).fill(0);

    console.log('format_deck_data HSCards:', HSCards.length)
    for (var i = 0; i < card_list.length; i++) {
        var filter_card = HSCards.find(cardItem => cardItem.hsId === card_list[i].card_hsid);
        if (!filter_card) {
            console.log('card not found:', card_list[i].card_hsid)
            continue
        }
        card_array.push(filter_card.dbfId)
        if (set_array.indexOf(filter_card.set_id) == -1) {
            set_array.push(filter_card.set_id)
        }
        count = card_list[i].count
        clazzCount[filter_card.type] += count
        rarityCount[filter_card.rarity] += count
        if (filter_card.cost > 7) {
            statistic[7] += count
        } else {
            statistic[filter_card.cost] += 1 
        }
        card_list[i].dbfId = filter_card.dbfId
        card_list[i].rarity = filter_card.rarity
        card_list[i].cname = filter_card.name
        card_list[i].tile = filter_card.img_tile_link?.length ? filter_card.img_tile_link : '';
    }
    
    for (var i = 0; i < sideboards_list.length; i++) {
        var filter_card = HSCards.find(cardItem => cardItem.hsId === sideboards_list[i].card_hsid); 
        var owner_card = HSCards.find(cardItem => cardItem.hsId === sideboards_list[i].card_owner);

        sideboards_list[i].dbfId = filter_card.dbfId
        sideboards_list[i].rarity = filter_card.rarity === null ? "" : filter_card.rarity;
        sideboards_list[i].cname = filter_card.name
        sideboards_list[i].tile = filter_card.img_tile_link?.length?filter_card.img_tile_link:''
        sideboards_list[i].owner_name = owner_card.name
        sideboards_list[i].sideboard_title = sideboards_list[i].sideboard_title
    }

    // data.dust_cost = String(data.dust_cost)
    data.card_list = JSON.stringify(data.card_list)
    data.sideboards = JSON.stringify(data.sideboards)
    data.mulligan = JSON.stringify(data.mulligan)
    data.win_rate = parseFloat(data.win_rate)
    data.duration = parseFloat(data.duration)
    data.turns = parseFloat(data.turns)
    data.clazzCount = JSON.stringify(clazzCount)
    data.rarityCount = JSON.stringify(rarityCount)
    data.statistic = JSON.stringify(statistic)
    data.matchup = data.matchups?data.matchups:''
    data.card_array = card_array
    data.set_array = set_array
    data.update_time = dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
    console.log('format_deck_data:', data)

    return data
}

async function post_trending_deck(data) {
    HSCards = await getAllCards()
    var format_data = format_deck_data(data)
    format_data.dust_cost = String(format_data.dust_cost)
    console.log('post_trending_deck:', format_data)
    var res = await post_table_data(tablesID.trending, format_data)
    console.log('post_trending_deck end:', res) 
}

async function put_trending_deck(recordID, data) {
    console.log('put_trending_deck start:', data)
    HSCards = await getAllCards()
    var format_data = format_deck_data(data)
    format_data.dust_cost = String(format_data.dust_cost)
    console.log('put_trending_deck:', recordID, format_data)
    var res = await put_table_data(tablesID.trending, recordID, format_data)
    console.log('put_trending_deck end:', res)
}

async function get_deck_detail(msg) {
    console.log('get_deck_detail:', msg)
    var query = {
        'where': JSON.stringify({
            'deck_id': {'$eq': msg.deck_id}
        })
    }
    var table_id = tablesID.standard_decks
    if(msg.deck_mode === 'Twist') {
        table_id = tablesID.twist_decks
    } else if(msg.deck_mode === 'Wild') {
        table_id = tablesID.wild_decks
    } else {
        console.log('未知模式 msg.deck_mode:', msg.deck_mode)
    }
    var res = await get_table_data(table_id, query)
    console.log('get_deck_detail end:', res)
    return {
        'table_id': table_id,
        'count': res.meta.total_count,
        'results': res.objects
    }
}

async function post_deck(table_id, data) {
    HSCards = await getAllCards()
    var format_data = format_deck_data(data)
    console.log('post_deck:', format_data)
    var res = await post_table_data(table_id, format_data)
    console.log('post_deck end:', res) 
}

async function put_deck(deck_id, table_id, data) {
    HSCards = await getAllCards()
   var format_data = format_deck_data(data)
   console.log('put_deck:', format_data)
   var res = await put_table_data(table_id, deck_id, format_data)
   console.log('put_deck end:', res) 
}

async function get_meta_data(msg) {
    console.log('get_meta_data:', msg)
    
    var query = {
        'where': JSON.stringify({
            "$and": [
                {"faction": {'$eq': msg.faction}},
                {"archetype": {'$eq': msg.archetype}},
                {"rank_range": {'$eq': msg.rank_range}}
            ]
        })
    }
    var res = await get_table_data(tablesID.winrate, query)
    console.log('get_meta_data end:', res)
    return {
        'count': res.meta.total_count,
        'results': res.objects
    } 
}

async function post_meta_data(data) {
    console.log('post_meta_data:', data)
    data.create_time = dateFormat("YYYY-mm-dd", new Date())
    var res = await post_table_data(tablesID.winrate, data)
    console.log('post_meta_data end:', res) 
}

async function put_meta_data(recordID, data) {
    console.log('put_meta_data:', recordID, data)
    data.create_time = dateFormat("YYYY-mm-dd", new Date())
    var res = await put_table_data(tablesID.winrate, recordID, data)
    console.log('put_meta_data end:', res) 
}

async function get_meta_detail(msg) {
    console.log('get_meta_detail:', msg)
    var query = {
        'where': JSON.stringify({
            "$and": [
                {"faction": {'$eq': msg.faction}},
                {"archetype": {'$eq': msg.archetype}},
                {"create_time": {'$eq': msg.create_time}}
            ]
        })
    }
    var res = await get_table_data(tablesID.winrate_detail, query)
    console.log('get_meta_detail end:', res)
    return {
        'count': res.meta.total_count,
        'results': res.objects
    }
}

function format_cards_list(cards_list) {
    console.log('format_cards_list:', cards_list)
    for (var cards of cards_list) {
        for (var card of cards) {
            var filter_card = HSCards.find(cardItem => cardItem.hsId === card.card_hsid);
            card.dbfId = filter_card.dbfId;
            card.rarity = filter_card.rarity;
            card.cname = filter_card.name;
            card.tile = filter_card.img_tile_link?.length?filter_card.img_tile_link:'';
        } 
    }
    return cards_list;
}

function format_meta_detail_data(data) {
    var core_cards = data.core_cards
    var pop_cards = data.pop_cards
    var cards_list = format_cards_list([core_cards, pop_cards])
    console.log('format_meta_detail_data 1:', cards_list)
    data.core_cards = JSON.stringify(cards_list[0])
    data.pop_cards = JSON.stringify(cards_list[1])
    data.create_time = dateFormat("YYYY-mm-dd", new Date())
    console.log('format_meta_detail_data 2:', data)
    return data
}

async function post_meta_detail(data) {
    console.log('post_meta_detail:', data)
    HSCards = await getAllCards()
    var format_data = format_meta_detail_data(data)
    var res = await post_table_data(tablesID.winrate_detail, format_data)
    console.log('post_meta_detail end:', res) 
}

async function put_meta_detail(recordID, data) {
    console.log('put_meta_detail:', recordID, data)
    HSCards = await getAllCards()
    var format_data = format_meta_detail_data(data)
    var res = await put_table_data(tablesID.winrate_detail, recordID, format_data)
    console.log('put_meta_detail end:', res) 
}

async function get_archetype(msg) {
    console.log('get_archetype:', msg)
    var query = {
        'where': JSON.stringify({
            "$and": [
                {'archetype_name': {'$eq': msg.archetype_name}},
                {"rank_range": {'$eq': msg.rank_range}}
            ]
        })
    }
    var res = await get_table_data(tablesID.archetype, query)
    console.log('get_archetype end:', res)
    return {
        'count': res.meta.total_count,
        'results': res.objects
    }
}

async function post_archetype(data) {
    console.log('post_archetype:', data)
    // data.update_time = dateFormat("YYYY-mm-dd", new Date())
    data.win_rate = String(data.win_rate)
    var res = await post_table_data(tablesID.archetype, data)
    console.log('post_archetype end:', res) 
}

async function put_archetype(recordID, data) {
    console.log('put_archetype:', recordID, data)
    // data.update_time = dateFormat("YYYY-mm-dd", new Date())
    data.win_rate = String(data.win_rate)
    var res = await put_table_data(tablesID.archetype, recordID, data)
    console.log('put_archetype end:', res) 
}

async function get_meta_detail_for_best_deck() {
    console.log('get_meta_detail_for_best_deck:')
    var query = {
        'where': JSON.stringify({
            "$and": [
                {"archetype": {'$ne': 'Other'}},
                {"create_time": {'$eq': dateFormat("YYYY-mm-dd", new Date())}}
            ]
        }),
        'limit': 2000
    }
    var res = await get_table_data(tablesID.winrate_detail, query)
    console.log('get_meta_detail_for_best_deck end:', res)
    return {
        'count': res.meta.total_count,
        'results': res.objects
    }
}