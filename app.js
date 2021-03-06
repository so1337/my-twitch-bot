"use strict";
var config = require('./config');
var lib = require('./lib');
var moment = require('moment');
var _ = require('lodash');
var tmi = require('tmi.js');
var opts = {
  options: {
    debug: true
  },
  connection: {
    reconnect: true,
  },
  identity: {
    username: config.USERNAME,
    password: config.PASS
  },
  channels: [config.CHANNEL]
};
var client = new tmi.client(opts);
var fetch = require('node-fetch');
var streamstatus, pidors = [],
  jokeTime = 1000 * 60 * 2,
  justReloaded = {},
  lastJoke = 0,
  popPidor = 0,
  ebyni = {},
  ebyni2 = {},
  flag = true,
  kappaFeed = 0;

client.connect();

client.on('connected', function(address, port) {
  lib.sendMsg(client, 'БОТ ПРИШЕЛ ГОВНА НАШЕЛ. ПИШИТЕ МНЕ СВОЕ ДЕРЬМО. Мой словарь на !faq');
});

client.on('clearchat', function(channel) {
  lib.sendMsg(client, 'ЗАБУДЬТЕ НАХУЙ ЧТО ВЫ ЗДЕСЬ ВИДЕЛИ. МЫ ВАМ СТЕРЛИ ПАМЯТЬ КАК ЛЮДИ В ЧЕРНОМ.');
});

client.on('join', function(channel, username, self) {
  if (self) return;
  if (justReloaded[username]) {
    delete justReloaded[username];
    return;
  }
  if (username == config.CHANNEL) lib.sendMsg(client, 'ГЛАВАРЬ БАНДЫ ВРЫВАЕТСЯ В ДВИЖ.' + username + ' В ЗДАНИИ.');
  else lib.sendMsg(client, 'ZDAROVA, @' + username + ' . ПОДРОЧИ МЕНЯ. Комманды на !faq');

});
client.on('subscription', function(channel, username, method) {
  lib.sendMsg(client, '@' + username + ', СПАСИБО ЗА ПОДПИСОЧКУ');
});
client.on('notice', function(channel, msgid, message) {
  console.log('msgid: ', msgid);
  console.log('message: ', message);
});
client.on('part', function(channel, username, self) {
  if (self) return;
  justReloaded[username] = true;
  setTimeout(function() {
    if (justReloaded[username]) {
      if (username == config.CHANNEL) lib.sendMsg(client, 'ГЛАВАРЬ БАНДЫ ПОКИНУЛ ДВИЖ.');
      else lib.sendMsg(client, '@' + username + ' ПОКИНУЛ ДВИЖ. НУ И ХУЙ С НИМ.');
      delete justReloaded[username];
    }
  }, 1000 * 60 * 5);

});
client.on('chat', function(channel, userstate, message, self) {
  if (self) return;

  var msg,
    args = message.split(' ');


  switch (args[0].toLowerCase()) {
    case '!uptime':
      lib.channelStatus().then(function(resp) {
        if (resp.stream) {
          msg = 'Strim startanyl ' + moment(resp.stream.created_at).fromNow();
        } else {
          msg = 'Стрим не едет, поезд сделал бум.';
        }
        lib.sendMsg(client, msg);
        msg = null;
      }, function(err) {
        console.log('error in channelStatus:', err);
      });
      break;
    case '!info':
      if (args.length == 1) args[1] = '';
      switch (args[1].toLowerCase()) {
        default: msg = 'вы забыли указать комманду или ввели какую-то хуйню. Вот пример правильного запроса инфы `!info !uptime`';
        break;
        case '!uptime':
            msg = 'Сколько стрим уже живет';
          break;
        case '!addpidor':
            msg = 'Добавить имя в список пидоров. Так же добавится сгенерированный по самому охуенному в мире алгоритму процент пидорства, который генерируется базируясь на образе жизни пациента, биографии, роде и т.д.';
          break;
        case '!getpidors':
            msg = 'Вывести список пидоров и процент их пидорства';
          break;
        case '!setstatus':
            msg = 'Высказать мнение о стриме. Пример: `говно`, `хуевый`, `жара ваще огоонь`, `стример питух` и т.д. Любая строка после комманды - мнение. Каждое новое мнение перезаписывает статус стрима';
          break;
        case '!joke':
            msg = 'Спиздануть рандомную шутку с башика';
          break;
        case '!getstatus':
            msg = 'Прочитать высказывание последнего эксперта в стримах о текущем состоянии стрима. По дефолту - жара';
          break;
        case '!poplastpidor':
            msg = 'Удалить последнего пидрилу в списке пидоров. Доступно 1 раз в 2 минуты.';
          break;
        case '!toukr':
            msg='Перевожу текст на украинский язык. Используется апишка Яндекс.Перевода - поэтому перевод может быть хуеват иногда. Но есишо - я поясню. Пример использования: `!toukr Привет, отсоси мой пенис`';
          break;
      }
      break;
    case '!faq':
      msg = 'Я умею: !uptime, !addpidor, !setstatus, !getpidors, !getstatus, !poplastpidor, !toukr, !joke и еще пару секретных. Для поясненией !info *комманда про которую хочешь узнать* . Отправляю Kappa голодающим неграм';
      break;
    case '!setstatus':
      delete args[0];
      streamstatus = _.join(args, ' ');
      msg = 'Эксперт в стримах спизданул, что текущее состояние стрима - `' + streamstatus + '` . Так и запишем';
      break;
    case '!getstatus':
      msg = 'Последний эксперт в стримах сказал, что стрим - `' + streamstatus + '`';
      break;
    case '!joke':

      if ((Date.now() - lastJoke) > jokeTime) {
        lastJoke = Date.now();
        lib.getJokes().then(function(data) {
          var joke = data[Math.floor(Math.random() * data.length)];
          lib.sendMsg(client, joke.elementPureHtml.replace(/<[A-Za-z =''#0-9]+\/?>/g, '').replace(/&[A-Za-z]+;/g, ''), channel);
        }, function(err) {
          console.log('err', err);
        });
      } else {
        msg = 'Охладись на пару минуток, юморист.';
      }
      break;
    case '!addpidor':
      if (args.length == 1) {
        if (!ebyni[userstate.username]) {
          lib.sendMsg(client, "Надо указывать кого пидором-то делаешь, далбон.");
          ebyni[userstate.username] = 1;
        } else {
          ebyni[userstate.username] = ebyni[userstate.username] + 1;
        }
        if (ebyni[userstate.username] == 2) {
          lib.sendMsg(client, "Далбон, отдупли плиз что я писал тебе.");
        }
        if (ebyni[userstate.username] == 3) {
          ebyni[userstate.username] = false;

          lib.silenceUser(client, userstate.username, Math.random() * 1000, '@' + userstate.username + ' , Завались на пару минуток.');
        }
        break;
      }
      var name = args[1].toLowerCase();
      if ((name.indexOf(config.CHANNEL) !== -1) || (name.indexOf(config.USERNAME) !== -1)) {
        args[1] = '@' + userstate.username;
      }
      var randPerc = Math.floor((Math.random() * 100) + 1);
      msg = args[1] + ' внесен в список пидоров.Он пидор на ' + randPerc + '%';
      pidors.push({
        name: args[1],
        perc: randPerc + '%'
      });
      break;
    case '!clearpidors':
      if (userstate.username == config.CHANNEL) {
        pidors = [];
        msg = "ЕБАТЬ ПАЛИТЕ. ОН ЧИСТИТ ПИДОРОВ.";
      }
      break;
    case '!toukr':
      if(args.length == 1){
            msg = "НАДО И ПЕРЕВОДИТЬ ЧЕ-ТО ДАЛБОН. ХУЛИ ТЫ ХУЙНЮ ТЫЧЕШЬ.";
            break;
      }else{
        delete args[0];
        var gotext = _.join(args, ' ');
        lib.translateMsg(gotext).then(function (res) {
            lib.sendMsg(client,'А НА УКРАИНСКОМ ЭТО ЗВУЧИТ ТАК: `'+ JSON.parse(res).text + ' `. ТЫ ОХУЕЛ, ДА? ВООБЩЕ ПРОЧИТАТЬ СМОГ?');
        });

      }
      break;
    case '!poplastpidor':
      if (pidors.length === 0) {
        msg = "СПИСОК ПИДОРОВ ЧИСТ. ВСТАВЬТЕ ПИДОРОВ.";
        break;
      }

      if ((Date.now() - popPidor) > jokeTime) {
        popPidor = Date.now();
        var last = pidors.pop();

        msg = last.name + " БЫЛ ОШИБОЧНЫМ ПИДОРОМ И ЕГО КАРМА ОЧИЩЕННА";
      } else {

        if (!ebyni2[userstate.username]) {
          msg = "Очистка одного пидора с конца списка юзабельна 1 раз в 2 минуты, але, не заябуй.";
          ebyni2[userstate.username] = 1;
        } else {
          if (ebyni2[userstate.username] == 1) msg = "Очистка одного пидора с конца списка юзабельна 1 раз в 2 минуты, ты какой-то очень тупой?";
          ebyni2[userstate.username] = ebyni2[userstate.username] + 1;
        }
        if (ebyni2[userstate.username] == 2) {
          msg = " 1 раз в 2 минуты можна.Далбон, отдупляй вообще что я пишу. Или уебу хуем.";
        }
        if (ebyni2[userstate.username] == 3) {
          ebyni2[userstate.username] = false;

          lib.silenceUser(client, userstate.username, Math.random() * 1000, '@' + userstate.username + ', я тебя так уебал хуем, что ты на пару минут заткнулся.');
        }


      }
      break;
    case '!getpidors':
      if (pidors.length === 0) {
        msg = "СПИСОК ПИДОРОВ ЧИСТ. ВСТАВЬТЕ ПИДОРОВ.";
        break;
      } else {
        msg = '';
        _.forEach(pidors, function(el) {

          msg = msg + el.name + " пидор на " + el.perc + ". \n";
        });
      }
      break;
  }
  if (msg && msg.length) {
    lib.sendMsg(client, msg);
  }
  if (message.indexOf('Kappa') !== -1) {
    var countedWords = _.countBy(args, _.identity);
    var end;
    if (countedWords['Kappa'] == 1) {
      end = 'отправляется';
    } else {
      end = 'отправляются';
    }



    kappaFeed = kappaFeed + countedWords['Kappa'];
    lib.sendMsg(client, 'Еще ' + countedWords['Kappa'] + ' Kappa ' + end + ' бедным голодающим ниггерам. За стрим собранно уже ' + kappaFeed + ' Kappa для ниггретосов. # Kappa _ПИТАТЕЛЬНЕЙ_ЛАЙКОВ');
    if (50 > kappaFeed && kappaFeed > 10 && flag) {
      lib.sendMsg(client, kappaFeed + ' Kappa собрано. Вы прокормили маленькую деревушку питательным Kappa');
      flag = false;
    }

    if (100 > kappaFeed && kappaFeed > 50 && !flag) {
      lib.sendMsg(client, kappaFeed + ' Kappa собрано. Вы прокормили поселок городского типа питательным Kappa');
      flag = true;
    }
    if (kappaFeed > 100 && flag) {
      lib.sendMsg(client, kappaFeed + ' Kappa собрано. Вы прокормили здоровенную мамку ' + userstate.username + '   питательным Kappa');
      flag = false;
    }

  }
});
