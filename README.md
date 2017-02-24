# flockSO

FlockSO is a product created at the Flock Hackathon - Flockathon, to be precise - hosted at their office on 18-19th Feb 2017.
It was a hackathon to get developers to create apps that make lives easy - of developers, teams and people in general. 

As developer who is your best friend after Google? Yes - StackOverflow.

This was a combined effort of 24 hours by @havanagrawal, @sunnyshah2894, @ak1132 and me!

## Stack details:
1. Node backend - watcher, services and everything else.
2. Flock App with all the below mentioned configurations enabled and queries mapped to correct service URLs. 
3. StackExchange API.

## Details:
We have tried to incroprate as many actions as possible, which we do normally on SO - any more suggestions and ideas are welcome. 
We also tried to use as many features of FlockOS as possible.

* [Slash commands](https://docs.flock.co/display/flockos/Slash+Commands) - use /SO to ask SO something! e.g. /SO java how to read a file
* [Bot](https://docs.flock.co/display/flockos/Bots) response - The server queries SO API to find the top questions related to your input and we pick 3 best answers which are sent via Bot response. 
* [FlockML](https://docs.flock.co/display/flockos/FlockML) - We wanted the user to be able to upvote an answer right from Flock - so we presented a button using hacks in FlockML ;) - WIP as we need to get OAuth in place
* [Watch](https://github.com/sunnypatel165/flockSO/blob/master/watcher.js) - The user can also add a question to the watch list. Whenever there is a change(a new answer, a new accepted answer, comment, change of question etc), your friend - Bot comes and updates you about any activity that happened on the app!
* [App launcher button](https://docs.flock.co/display/flockos/Launcher+Buttons) - to show the user a list of all the questions he is watching - and obviously to un-watch them(WIP)!

PS - Any one willing to contribute to make this app live and finish all WIPs - I owe you a :beer:





