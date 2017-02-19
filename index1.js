var config = require('./config.js');
var flock = require('flockos');
var express = require('express');
var store = require('./store.js');
var chrono = require('chrono-node');
var Mustache = require('mustache');
var fs = require('fs');
var util = require('util');
var request = require('request');
var Client = require('node-rest-client').Client;
var client = new Client();

var watcher = require('./watcher.js');

flock.appId = config.appId;
flock.appSecret = config.appSecret;

var url = 'https://api.stackexchange.com/2.2/';
var searchUrlAppend = 'search?order=desc&sort=votes&site=stackoverflow&intitle=';

var questionAnswerUrlAppend = '?site=stackoverflow&filter=withbody';

var baseUrl = 'https://f1dbdfaf.ngrok.io/';

var app = express();
app.use(flock.events.tokenVerifier);
app.post('/events', flock.events.listener);

app.set('view engine', 'ejs');

app.listen(8080, function() {
    console.log('Listening on 8080');
});

setTimeout(function(){
    watcher.startWatcher(function(userId, questionId) {
        flock.chat.sendMessage(config.botToken, {
            to: userId,
            text: "Question Id " + questionId + " has changed!"
        });
    });
}, 0);

app.get('/addToWatchList/:userId/:questionId',function(req,res){
    
    var userId = req.params.userId;
    var questionId = req.params.questionId;
    
    console.log( "userId = " + userId + " questionId " + questionId ); 
    watcher.addWatcher(userId, questionId);

    var date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    res.send("Hi, we will be watching the question and notify you if any answers are added");
    //add_to_watch_list(userId, questionId);
    
}); 

app.get('/upvoteAnswer/:userId/:answerId', function(req, res){
    var userId = req.params.userId;
    var questionId = req.params.answerId;
    
    var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    res.send('Thank you for upvoting! :)');
}); 

app.get('/list',function(req,res){

    var event = JSON.parse(req.query.flockEvent);
    
    res.set('Content-Type', 'text/html');

    var userId = event.userId;
    
    console.log( "userId = " + userId); 
    var watchList = watcher.getWatchList(userId);

    var questionTitles = getQuestionTitles(watchList[userId], res);
}); 

function getQuestionTitles(watchList, res) {
    questionTitles = [];

    var questionUrl = url + '/questions/';
    console.log(watchList);
    
    for(var i = 0; i < watchList.length-1; i++) {
        console.log(i);
        var questionId = watchList[i];
        questionUrl = questionUrl + questionId + ';' ;
    }

    questionUrl = questionUrl + watchList[watchList.length - 1]+questionAnswerUrlAppend;
    console.log(questionUrl);
    client.get(questionUrl, function (data, response) {
        console.log("Got question title for watch list!");
        console.log(data);
        for(i in data.items){
            console.log("Sunnsunn = " + i ) ; 
            questionTitles.push(data.items[i].title);
        }
        
        console.log("questionTitles "  + questionTitles);
        var body = '<html><head></head><body><style>.list-type1{width:400px;margin:0 auto}.list-type1 ol{counter-reset:li;list-style:none;font-size:15px;font-family:Raleway,sans-serif;padding:0;margin-bottom:4em}.list-type1 ol ol{margin:0 0 0 2em}.list-type1 a{position:relative;display:block;padding:.4em .4em .4em 2em;margin:.5em 0;background:#93C775;color:#000;text-decoration:none;-moz-border-radius:.3em;-webkit-border-radius:.3em;border-radius:10em;transition:all .2s ease-in-out}.list-type1 a:hover{background:#d6d4d4;text-decoration:none;transform:scale(1.1)}.list-type1 a:before{content:counter(li);counter-increment:li;position:absolute;left:-1.3em;top:50%;margin-top:-1.3em;background:#93C775;height:2em;width:2em;line-height:2em;border:.3em solid #fff;text-align:center;font-weight:700;-moz-border-radius:2em;-webkit-border-radius:2em;border-radius:2em;color:#FFF} </style><div class="list-type1"><ol>'
        var end = '</ol></div></body></html>' 
        for (i in questionTitles) {
            body += '<li><a href="https://www.stackoverflow.com/q/' + watchList[i] + '" target="_blank">'+ questionTitles[i] + "</a></li>";
        }
        body += end ; 
        console.log(body);
        res.send(body);
    });

    return questionTitles;
}

function sendMessageByBot(event, questions) {
    
    var css = ".btn { line-height: 30px;display: inline-block;float:left;width: 200px;text-align: center; cursor:pointer; background: #0abe50; background-image: -webkit-linear-gradient(top, #0abe50, #0abe50); background-image: -moz-linear-gradient(top, #0abe50, #0abe50); background-image: -ms-linear-gradient(top, #0abe50, #0abe50); background-image: -o-linear-gradient(top, #0abe50, #0abe50); background-image: linear-gradient(to bottom, #0abe50, #0abe50); -webkit-border-radius: 0; -moz-border-radius: 0; border-radius: 0px; font-family: Arial; color: #f2f2f2; font-size: 14px; padding: 5px 5px 5px 5px; text-decoration: none; }.btn:hover { background: #5ce08f; background-image: -webkit-linear-gradient(top, #5ce08f, #5ce08f); background-image: -moz-linear-gradient(top, #5ce08f, #5ce08f); background-image: -ms-linear-gradient(top, #5ce08f, #5ce08f); background-image: -o-linear-gradient(top, #5ce08f, #5ce08f); background-image: linear-gradient(to bottom, #5ce08f, #5ce08f); text-decoration: none; }" ;
    var start = '<!DOCTYPE html><html><head><title>Questions</title></head><style>'+css+'</style><body>' ;
    var end = '</body></html>';

    console.log("Firing BOT! :D");

    questions.forEach(function(e){

        var linkToWatch = baseUrl + 'addToWatchList/' + event.userId + '/'+ e.questionId ; 

        e.answers.forEach(function(d){
            var linkToUpvote = baseUrl + 'upvoteAnswer/' + event.userId + '/' + d.answerId ; 

            var start = '<!DOCTYPE html><html><head><title>Questions</title></head><style>' + css + '</style><body>';
            start += '<li style="display:inline-block;">' + e.question + '<br><a href="' + linkToWatch + '" class="btn">Watch</a></li><ul>' ;
            start += '<div><code>' + d.answer + '</code></div>' ;
            start += '</ul><br><a href="' + linkToUpvote +'" class="btn">Upvote this answer</a>' + end;
            body = start;
            console.log(body);
            flock.chat.sendMessage(config.botToken, {
                to: event.userId,
                attachments: [{
                            "title": "We found something relevant on stackoverflow",
                            "views": {
                                "html": { "inline": body, "width" : 400, "height" : 400}
                            }
                    }]          
            });
        });
    });
}

flock.events.on('app.install', function (event, callback) {

    flock.chat.sendMessage(config.botToken, {
            to: event.userId,
            text: "Welcome to the FlockSo app! FlockSo is StackOverflow for FlockOs"
    });

    store.saveToken(event.userId, event.token);
    callback();
});

flock.events.on('client.slashCommand', function (event, callback) {

    var commandText = event.text; 
    console.log("Whole command is " + commandText);

    var searchUrl = url + searchUrlAppend + encodeURIComponent(commandText.trim());

    console.log(searchUrl);

    var questions = [];
    var question = {};

    client.registerMethod("jsonMethod", searchUrl, "GET");
    client.methods.jsonMethod(function (data, response) {

        if (data.items == null) {
            console.log("Unable to find any matching questions");
            return -1;
        }

        var questionId = data.items[0].question_id;
        console.log("Found questionId: " + questionId);

        var questionUrl = url + '/questions/' + questionId + questionAnswerUrlAppend;

        client.registerMethod("jsonMethod", questionUrl, "GET");
        client.methods.jsonMethod(function (data, response) {
            var questionTitle = data.items[0].title;

            question['question'] = questionTitle;
            question['questionId'] = questionId;

            console.log("Question Title - " + questionTitle); 

            var answerUrl = url + '/questions/' + questionId + '/answers' + questionAnswerUrlAppend;

            client.registerMethod("jsonMethod", answerUrl , "GET");
            client.methods.jsonMethod(function (data, response) {

                var answers = data.items.slice(1, 3).map(function(item) {return {'answer': item.body, 'answerId': item.answer_id}});
                console.log("Found answers: ")

                answers.forEach(console.log);

                question['answers'] = answers;

                console.log("===========================");
                questions.push(question);
                console.log(JSON.stringify(questions));
                
                sendMessageByBot(event, questions);
            });
        });
    });
});
