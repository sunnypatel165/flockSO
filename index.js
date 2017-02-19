var config = require('./config.js');
var flock = require('flockos');
var express = require('express');
var store = require('./store.js');
var chrono = require('chrono-node');
var Mustache = require('mustache');
var fs = require('fs');
var util = require('util');
f

flock.appId = config.appId;
flock.appSecret = config.appSecret;

var app = express();


var url = 'https://api.stackexchange.com/2.2/';//=java%20how%20to%20read%20file&site=stackoverflow' ;
var searchUrlAppend = 'search?order=desc&sort=votes&site=stackoverflow&intitle=';

var questionAnswerUrlAppend = '?site=stackoverflow&filter=withbody';

app.use(flock.events.tokenVerifier);
app.post('/events', flock.events.listener);

app.listen(8080, function () {
    console.log('Listening on 8080');
});


/*app.get("/abc",function (req, res){

    var url = 'https://api.stackexchange.com/2.2/search?order=desc&sort=votes&intitle=java%20how%20to%20read%20file&site=stackoverflow' ;
    console.log("hi sfsdcv");
    console.log(res);
    request.get({url:url}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body) ;// Print the google web page.
         }
    });

});
*/

flock.events.on('app.install', function (event, callback) {
    store.saveToken(event.userId, event.token);
    callback();
});

flock.events.on('client.slashCommand', function (event, callback) {

    var commandText = event.text; 
    console.log("Whole command is " + commandText);

    var searchUrl = url + searchUrlAppend + encodeURIComponent(commandText.trim());

    console.log(searchUrl);

    client.registerMethod("jsonMethod", searchUrl, "GET");
    client.methods.jsonMethod(function (data, response) {
        var questionId = data.items[0].question_id;
        console.log("Found questionId: " + questionId);

        var questionUrl = url + '/questions/' + questionId + questionAnswerUrlAppend;

        client.registerMethod("jsonMethod", questionUrl, "GET");
            client.methods.jsonMethod(function (data, response) {
            var questionTitle = data.items[0].title;
            console.log("Question Title - " + questionTitle); 

            var answerUrl = url + '/questions/' + questionId + '/answers' + questionAnswerUrlAppend;

            client.registerMethod("jsonMethod", answerUrl , "GET");
            client.methods.jsonMethod(function (data, response) {

                var answers = data.items.slice(1, 3).map(function(item) {return item.body})
                console.log("Found answers: ")

                answers.forEach(console.log);
            });
        });
    });
    
    flock.chat.sendMessage(config.botToken, {
        to: event.userId,
        html: '<flockml>Hello <strong>foobar</strong>, Welcome to <a style="background-color: #4CAF50; border: none;color: white;padding: 15px 32px;text-align: center;text-decoration: none;display: inline-block;font-size: 16px;" href="https://flock.co/">Flock!</a></flockml>' ,
    });

    //<flockml>Hello <strong>foobar</strong>, Welcome to <a href="https://flock.co/">Flock!</a></flockml>

    /*var r = parseDate(event.text);
    console.log('parse result', r);
    var desc = event.text.slice(r.end).trim() ; 

    if (r) {
        var alarm = {
            userId: event.userId,
            time: r.date.getTime(),
            text: event.text.slice(r.end).trim()
        };
        console.log('adding alarm', alarm);
        addAlarm(alarm);
        callback(null, { text: 'Alarm added' });
    } else {
        callback(null, { text: 'Alarm time not specified' });
    }*/
});

var parseDate = function (text) {
    var r = chrono.parse(text);
    if (r && r.length > 0) {
        return {
            date: r[0].start.date(),
            start: r[0].index,
            end: r[0].index + r[0].text.length
        };
    } else {
        return null;
    }
};

var listTemplate = fs.readFileSync('list.mustache.html', 'utf8');
app.get('/list', function (req, res) {
    var event = JSON.parse(req.query.flockEvent);
    var alarms = store.userAlarms(event.userId).map(function (alarm) {
        return {
            text: alarm.text,
            timeString: new Date(alarm.time).toLocaleString()
        }
    });
    res.set('Content-Type', 'text/html');
    var body = Mustache.render(listTemplate, { alarms: alarms });
    res.send(body);
});

flock.events.on('client.messageAction', function (event, callback) {
    var messages = event.messages;
    if (!(messages && messages.length > 0)) {
        console.log('chat', event.chat);
        console.log('uids', event.messageUids);
        console.log('token', store.getToken(event.userId));
        flock.chat.fetchMessages(store.getToken(event.userId), {
            chat: event.chat,
            uids: event.messageUids
        }, function (error, messages) {
            if (error) {
                console.warn('Got error');
                callback(error);
            } else {
                setAlarms(messages);
            }
        });
    } else {
        setAlarms(messages);
    }
    var setAlarms = function (messages) {
        var alarms = messages.map(function (message) {
            var parsed = parseDate(message.text);
            if (parsed) {
                return {
                    userId: event.userId,
                    time: parsed.date.getTime(),
                    text: util.format('In %s: %s', event.chatName, message.text)
                }
            } else {
                return null;
            }
        }).filter(function (alarm) {
            return alarm !== null;
        });
        if (alarms.length > 0) {
            alarms.forEach(addAlarm);
            callback(null, { text: util.format('%d alarm(s) added', alarms.length) });
        } else {
            callback(null, { text: 'No alarms found' });
        }
    };
});