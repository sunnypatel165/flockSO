'use strict';

var Client = require('node-rest-client').Client;
var client = new Client();

// Keys are stringified userId-questionId pairs
// Values are the last activity time
var watcher = {};

var url = 'https://api.stackexchange.com/2.2/';
var questionAnswerUrlAppend = '?site=stackoverflow';

function getLastActivityTime(questionId) {
    var questionUrl = url + '/questions/' + questionId + questionAnswerUrlAppend;

    console.log(questionUrl);

    var lastActivityDate = 0;

    client.get(questionUrl, function (data, response) {
        lastActivityDate = data.items[0].last_activity_date;
        console.log("Last Activity Date - " + lastActivityDate);
    });

    return lastActivityDate;
}

function checkForUpdates(callback) {
    console.log("Checking for updates");

    console.log(watcher);

    for(var toWatchObj in watcher) {
        var currentTime = watcher[toWatchObj];

        console.log(toWatchObj);

        var questionId = toWatchObj.split(",")[1];
        var userId = toWatchObj.split(",")[0];

        console.log("Question id: " + questionId);

        var newTime = getLastActivityTime(questionId);

        console.log("Current known last activity time: " + currentTime);

        if (newTime > currentTime){
            console.log("Sending message to bot")
            event = {'userId': userId}
            callback(userId, questionId);
            watcher[questionId] =  newTime;
        }
    }
}

module.exports = {

    getWatchList: function(userId){
        console.log("Inside getWatchList");
        var watchedQuestions = [];
        for(var toWatchObj in watcher) {
            console.log(toWatchObj);

            var questionId = toWatchObj.split(",")[1];
            var watchingUserId = toWatchObj.split(",")[0];

            if (watchingUserId === userId){
                watchedQuestions.push(questionId);
            }
        }
        return watchedQuestions;
    },
    addWatcher: function (userId, questionId) {
        console.log("Now watching for userId = " + userId + ", questionId = " + questionId);
        watcher[[userId, questionId]] = getLastActivityTime(questionId);
    },

    startWatcher: function (callback) {
        console.log("Starting watcher");
        setInterval(function(){checkForUpdates(callback);}, 300000);
    }
};
