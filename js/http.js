// const host = 'http://127.0.0.1:8001';
const host = 'http://47.98.187.217'

function comonFetch(url) {
    return new Promise((resolve, reject) => {
        fetch(url).then(res => res.json())
                .then(data => resolve(data))
                .catch(err => reject(err))
    })
}

class Ajax {
  constructor(cookies) {
      this.host = host
      this.cookies = cookies
  }

  get(path, query) {
    return new Promise((resolve, reject) => {
      var url
      if (query) {
          var query_ = new URLSearchParams(query)
          url = this.host+path+'?'+query_
      } else {
          url = this.host+path
      }
      console.log(url)
      fetch(url)
        .then(res => res.json())
        .then(data => resolve(data))
        .catch(err => reject(err))
    })
  }
  // post方式
  post(path, data) {
    return new Promise((resolve, reject) => {
      fetch(this.host+path, {
          method: 'POST',
          headers: {
            'Content-type': 'application/json',
            'X-CSRFToken': this.cookies.csrftoken
          },
          body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => resolve(data))
        .catch(err => reject(err))

    })
  }

  //put 修改
  put(path, data) {
    return new Promise((resolve, reject) => {
      fetch(this.host+path, {
          method: 'PUT',
          headers: {
            'Content-type': 'application/json',
            'X-CSRFToken': this.cookies.csrftoken
          },
          body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => resolve(data))
        .catch(err => reject(err))

    })
  }

  //delete
  delete(path, data) {
    return new Promise((resolve, reject) => {
      fetch(this.host+path, {
          method: 'DELETE',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => resolve('数据删除成功!'))
        .catch(err => reject(err))
    })
  }
}

var http = new Ajax(this.cookies)

// const getTrendingList = () => {return http.get('/trending/')}
const getTrendingDeck = (query) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('getTrendingDeck', singleServerMode)
  if (singleServerMode == 'true') {
    console.log('getTrendingDeck 单服务器模式')
    return get_trending_deck(query)    
  } else {
    console.log('getTrendingDeck 双服务器模式')
    return http.get('/trending/', query)
  }
}

const postTrendingDeck = (data) => { 
  var singleServerMode = localStorage['singleServerMode']
  if (singleServerMode == 'true') {
    console.log('postTrendingDeck 单服务器模式')
    return post_trending_deck(data) 
  } else {
    console.log('postTrendingDeck 双服务器模式')
    return http.post('/trending/', data)
  }
}
const putTrendingDeck = (id, data) => { 
  var singleServerMode = localStorage['singleServerMode']
  if (singleServerMode == 'true') {
    console.log('putTrendingDeck 单服务器模式')
    return put_trending_deck(id, data)  
  } else {
    console.log('putTrendingDeck 双服务器模式')
    return http.put('/trending/'+id+'/', data) 
  }
}

const getDeckDetail = (query) => { 
  var singleServerMode = localStorage['singleServerMode']
  if (singleServerMode == 'true') {
    console.log('getDeckDetail 单服务器模式')
    return get_deck_detail(query)  
  } else {
    console.log('getDeckDetail 双服务器模式')
    return http.get('/decks/', query)
  }
}
const addDeck = (table_id, data) => { 
  var singleServerMode = localStorage['singleServerMode']
  if (singleServerMode == 'true') {
    console.log('addDeck 单服务器模式')
    return post_deck(table_id, data)  
  } else {
    console.log('addDeck 双服务器模式')
    return http.post('/decks/', data)
  }
}
const updateDeck = (id, table_id, data) => {
  var singleServerMode = localStorage['singleServerMode']
  if (singleServerMode == 'true') {
    console.log('updateDeck 单服务器模式')
    return put_deck(id, table_id, data)  
  } else {
    console.log('updateDeck 双服务器模式')
    return http.put('/decks/'+id+'/', data)
  }
}

const getMetaData = (query) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('getMetaData', query)
  if (singleServerMode == 'true') {
    console.log('getMetaData 单服务器模式')
    return get_meta_data(query)
  } else {
    console.log('getMetaData 双服务器模式')
    return http.get('/winrate/', query)
  }
}
const addMetaData = (data) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('addMetaData', data)
  if (singleServerMode == 'true') {
    console.log('addMetaData 单服务器模式')
    return post_meta_data(data)  
  } else {
    console.log('addMetaData 双服务器模式')
    return http.post('/winrate/', data) 
  }
}
const updateMetaData = (id, data) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('updateMetaData', data)
  if (singleServerMode == 'true') {
    console.log('updateMetaData 单服务器模式')
    return put_meta_data(id, data) 
  } else {
    console.log('updateMetaData 双服务器模式')
    return http.put('/winrate/'+id+'/', data)
  }
}

const getMetaDetail = (query) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('getMetaDetail', query)
  if (singleServerMode == 'true') {
    console.log('getMetaDetail 单服务器模式')
    return get_meta_detail(query) 
  } else {
    console.log('getMetaDetail 双服务器模式')
    return http.get('/winrate/', query) 
  }
}

const addMetaDetail = (data) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('addMetaDetail', data)
  if (singleServerMode == 'true') {
    console.log('addMetaDetail 单服务器模式')
    return post_meta_detail(data) 
  } else {
    console.log('addMetaDetail 双服务器模式')
    return http.post('/winrate/', data)
  }
}

const updateMetaDetail = (id, data) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('updateMetaDetail', data)
  if (singleServerMode == 'true') {
    console.log('updateMetaDetail 单服务器模式')
    return put_meta_detail(id, data) 
  } else {
    console.log('updateMetaDetail 双服务器模式')
    return http.put('/winrate/'+id+'/', data)
  }
}

const getArchetype = (query) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('getArchetype', query)
  if (singleServerMode == 'true') {
    console.log('getArchetype 单服务器模式')
    return get_archetype(query) 
  } else {
    console.log('getArchetype 双服务器模式')
    return http.get('/archetype/', query) 
  }
}
const addArchetype = (data) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('addArchetype', data)
  if (singleServerMode == 'true') {
    console.log('addArchetype 单服务器模式')
    return post_archetype(data) 
  } else {
    console.log('addArchetype 双服务器模式')
    return http.post('/archetype/', data)
  }
}
const updateArchetype = (id, data) => {
  var singleServerMode = localStorage['singleServerMode']
  console.log('updateArchetype', data)
  if (singleServerMode == 'true') {
    console.log('updateArchetype 单服务器模式')
    return put_archetype(id, data) 
  } else {
    console.log('updateArchetype 双服务器模式')
    return http.put('/archetype/'+id+'/', data)
  }
}

const getRankData = (query) => {
  var singleServerMode = localStorage['singleServerMode']
  if (singleServerMode == 'true') {
    console.log('getRankData 单服务器模式')
    return get_rank_data(query)  
  } else {
    console.log('getRankData 双服务器模式')
    return http.get('/rank/', query)
  }
}
const addRankData = (data) => {
  var singleServerMode = localStorage['singleServerMode']
  if (singleServerMode == 'true') {
    console.log('addRankData 单服务器模式')
    return post_rank_data(data)  
  } else {
    console.log('addRankData 双服务器模式')
    return http.post('/rank/', data)
  }
}
const updateRankData = (id, data) => { 
  var singleServerMode = localStorage['singleServerMode']
  if (singleServerMode == 'true') {
    console.log('updateRankData 单服务器模式')
    return put_rank_data(id, data)  
  } else {
    console.log('updateRankData 双服务器模式')
    return http.put('/rank/'+id+'/', data)
  }
}