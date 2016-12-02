var fetch = require('node-fetch');
var config = require('./config');

module.exports = {
  channelStatus: function() {
    console.log('infoRequested');
    channel =  config.CHANNEL;

    return fetch('https://api.twitch.tv/kraken/streams/' + channel, {
        headers: {
          'Client-ID': config.TOKEN
        }
      })
      .then(function(res) {
        if (res.status === 200) {
          console.log('infoGet');
          console.log('res.status', res.status);
          return res.json();
        } else {
          console.log('infoFail');
          return res;
        }
      })
  },
  getJokes: function() {
    return fetch('http://www.umori.li/api/get?site=bash.im&name=bash&num=100')
      .then(function(resp) {
        if (resp.status === 200) {
          return resp.json();
        } else {
          return null;
        }
      })
  },
  silenceUser: function(client, user, time, msg) {
    client.timeout(config.CHANNEL, user, time);
    if(msg)this.sendMsg(client,msg)

  },
  sendMsg: function(client,msg) {
    client.action(config.CHANNEL, " : " + msg);
  }
}
