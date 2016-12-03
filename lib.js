var config = require('./config');
var request = require('request-promise');
module.exports = {
  channelStatus: function() {
    console.log('infoRequested');
    channel = config.CHANNEL;

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
      });
  },
  getJokes: function() {
    return request('http://www.umori.li/api/get?site=bash.im&name=bash&num=100')
      .then(function(resp) {

          return JSON.parse(resp);
      }).catch(function (err) {
      return null;
    });
  },
  silenceUser: function(client, user, time, msg) {
    client.timeout(config.CHANNEL, user, time);
    if (msg) this.sendMsg(client, msg);

  },
  sendMsg: function(client, msg) {
    client.action(config.CHANNEL, " : " + msg);
  },
  translateMsg: function(text) {
    text.replace(/['"]+/g, '');
  return request.post(
      'https://translate.yandex.net/api/v1.5/tr.json/translate', {
        form: {
          lang: 'uk',
          key: 'trnsl.1.1.20161203T095721Z.fd098b6d210877ec.ce038b4e9406b605dbb194cbbd0c16385dcf6c64',
          text: text.toString()
        }
      },
      function(error, response, body) {

        return JSON.parse(body) ;
      }
    );


  }
};
