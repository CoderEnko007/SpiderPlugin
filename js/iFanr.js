var api_key = {
    'client_id':'ec59002ba0fc4c74bf50',
    'client_secret':'bd7264a9542173aa188b650c1b76580e7d612355'
}

tablesID = {
    'decks_trending': 55498,
    'decks_decks': 53174,
    'standard_decks': 53174,
    'wild_decks': 55625,
    'arena_cards': 70488,
    'trending': 53120,
    'winrate': 96629,
    'new_cards': 88786,
    'activation_code': 90990
}

client_id = api_key.client_id
client_secret = api_key.client_secret
code_url = "https://cloud.minapp.com/api/oauth2/hydrogen/openapi/authorize/"
token_url = "https://cloud.minapp.com/api/oauth2/access_token/"

async function get_code() {
    var params = {
        'client_id': client_id,
        'client_secret': client_secret
    }
    var res = await fetch(code_url, {
        method: 'POST',
        body: JSON.stringify(params),
    })
    var jsonData = await res.json()
    console.log(jsonData.code)
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
    tableID = tablesID.trending
    query = {
        'where': JSON.stringify({
            'faction': {'$eq': 'Hunter'}
        })
    }
    var token = await get_token()
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
    var jsonData = await res.json()
    console.log(jsonData)
}