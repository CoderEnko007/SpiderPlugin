// const host = 'http://127.0.0.1:8001';
const host = 'http://47.98.187.217'

function comonFetch(url) {
    return new Promise((resolve, reject) => {
        fetch(url).then(res => res.json())
                .then(data => resolve(data))
                .then(err => reject(err))
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

  const getTrendingList = () => {return http.get('/trending/')}
  const getTrendingDeck = (query) => { return http.get('/trending/', query)}
  const postTrendingDeck = (data) => { return http.post('/trending/', data)}
  const putTrendingDeck = (id, data) => { return http.put('/trending/'+id+'/', data)}

  const getDeckDetail = (query) => { return http.get('/decks/', query) }
  const addDeck = (data) => { return http.post('/decks/', data) }
  const updateDeck = (id, data) => { return http.put('/decks/'+id+'/', data) }

  const getMetaData = (query) => { return http.get('/winrate/', query) }
  const addMetaData = (data) => { return http.post('/winrate/', data) }
  const updateMetaData = (id, data) => { return http.put('/winrate/'+id+'/', data) }

  const getArchetype = (query) => { return http.get('/archetype/', query) }
  const addArchetype = (data) => { return http.post('/archetype/', data) }
  const updateArchetype = (id, data) => { return http.put('/archetype/'+id+'/', data) }

  const getRankData = (query) => { return http.get('/rank/', query) }
  const addRankData = (data) => { return http.post('/rank/', data) }
  const updateRankData = (id, data) => { return http.put('/rank/'+id+'/', data) }