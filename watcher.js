'use strict';

var fs = require('fs');
var Client = require('node-rest-client').Client;
var client = new Client();

var dbFile = 'watcherDb.json';

// Functions for persistence
var watcherDatabase = {
    read: function(dbFilePath) {
        try {
            var stringContent = fs.readFileSync(dbFilePath);
            var watcherState = JSON.parse(stringContent);
            return watcherState;
        } catch (e) {
            console.log('No db found, initializing to empty state');
            return {};
        }
    },

    save: function(watcherState, dbFilePath) {
        console.log('Saving watchers to db');
        var stringContent = JSON.stringify(watcherState);
        fs.writeFileSync(dbFilePath, stringContent);
    }
}

// Keys are stringified userId-questionId pairs
// Values are the last activity time
var watcher = watcherDatabase.read(dbFile);

// Save the watcher state on exit/interrups
process.on('SIGINT', function () { console.log('SIGINT'); process.exit(); });
process.on('SIGTERM', function () { console.log('SIGTERM'); process.exit(); });
process.on('exit', function() { watcherDatabase.save(watcher, dbFile) });

var url = 'https://api.stackexchange.com/2.2/';
var questionAnswerUrlAppend = '?site=stackoverflow';

// This is the frequency at which we check for updates on the watcher
var updateIntervalInMilliseconds = 300000;

function getLastActivityTime(questionId) {
    var questionUrl = url + '/questions/' + questionId + questionAnswerUrlAppend;

    console.log(questionUrl);

    var lastActivityDate = 0;

    // TODO: This call is not blocking!
    // We need to use either futures/promises
    client.get(questionUrl, function (data, response) {
        if (!(data.items == null)) {
            lastActivityDate = data.items[0].last_activity_date;
            console.log("Last Activity Date - " + lastActivityDate);
        }
        else {
            console.log("Unable to retrieve last activity date details for " + questionId);
        }
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
            console.log("There has been new activity on question " + questionId);

            // We call callback first because we want the user to be notified first
            // If we update the watcher, but the notification fails, the user will never know
            // that the question was updated!
            callback(userId, questionId);
            watcher[questionId] =  newTime;
        }
    }
}

module.exports = {

    // For a given userId, get a list of all the questionIds that he/she is watching
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

    // Add a question id to the watchlist of a particular user
    addWatcher: function(userId, questionId) {
        console.log("Now watching for userId = " + userId + ", questionId = " + questionId);
        watcher[[userId, questionId]] = getLastActivityTime(questionId);
    },

    // Start the watcher thread
    // Intermittently check for updates on all watched questions
    startWatcher: function (callback) {
        console.log("Starting watcher");
        setInterval(function() {
            checkForUpdates(callback);
        }, updateIntervalInMilliseconds);
    }
};
