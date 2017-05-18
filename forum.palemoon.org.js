/***************************************************************
 forum.palemoon.org
 (c) Off.Just.Off@gmail.com, 2017
 
 For X-notifier 3.5.23:
     https://addons.mozilla.org/addon/xnotifier/versions/3.5.23

 Settings: 
 [*] Notify inbox only -> Check only private messages 
                          or also include notifications
 [*] Include spam      -> Include unread topics
                          (if "Notify inbox only" is unchecked)

 ***************************************************************/

var name = "forum.palemoon.org";
var ver = "2017-05-18";
var supportInboxOnly = true;
var supportShowFolders = true;
var supportIncludeSpam = true;

function init() {
    this.initStage = ST_PRE;
    this.loginData = ["https://forum.palemoon.org/ucp.php", "username", "password", "&autologin=on&redirect=index.php&login=Login"];
    this.dataURL = "https://forum.palemoon.org/search.php?search_id=unreadposts";
    this.inboxURL = "https://forum.palemoon.org/ucp.php?i=pm&folder=inbox";
    this.viewURL = this.dataURL;
    this.cookieDomain = "forum.palemoon.org";
}

function getData(aData) {
    var obj = {}, fld = [];
    this.count = -1;
    var priv = /Private messages \[<\/span><strong>(\d+)<\/strong>/.exec(aData);
    if (priv) {
        fld.push("Private messages");
        fld.push(parseInt(priv[1]));
        this.count = parseInt(priv[1]);
    }
    var notif = /Notifications \[<\/span><strong>(\d+)<\/strong>/.exec(aData);
    if (notif) {
        fld.push("Notifications");
        fld.push(parseInt(notif[1]));
        if (!this.inboxOnly)
            this.count += parseInt(notif[1]);
    }
    var unread = /Mark all read<\/a>.+?Search found (\d+) match/.exec(aData);
    if (unread) {
        fld.push("Unread topics");
        fld.push(parseInt(unread[1]));
        if (!this.inboxOnly && this.includeSpam)
            this.count += parseInt(unread[1]);
    }
    if (this.showFolders && fld) {
        obj.folders = fld;
    }
    return obj;
}

function checkLogin(aData, aHttp) {
    switch (this.stage) {
        case ST_CHECK:
            this.getHtml("https://forum.palemoon.org/index.php");
            return false;
        case ST_CHECK + 1:
            if (aData.match(/<span>Private messages/)) {
                this.stage = ST_DATA;
                this.getHtml(this.dataURL);
                return true;
            } else {
                this.stage = this.initStage;
                return this.process("");
            }
    }
    this.onError();
    return true;
}

function process(aData, aHttp) {
    switch (this.stage) {
        case ST_PRE:
            this.getHtml("https://forum.palemoon.org/ucp.php?mode=login");
            return false;
        case ST_PRE_RES:
            this.sidData = "";
            var sid = aData.match(/name="sid" value="([0-9a-f]+)"/);
            if (sid) {
                this.sidData = sid[1];
                this.stage = ST_LOGIN;
                return this.process(aData, aHttp);
            } else if (aData.match(/<span>Private messages/)) {
                this.getHtml(this.dataURL);
                this.stage = ST_DATA;
                return true;
            }
            this.onError();
            break;
        case ST_LOGIN:
            this.getHtml(this.loginData[LOGIN_URL], this.loginData[LOGIN_POST] + "&sid=" + this.sidData);
            return false;
        case ST_LOGIN_RES:
            this.getHtml(this.dataURL);
            this.stage = ST_DATA;
            return true;
    }
    return this.baseProcess(aData, aHttp);
}

function getViewURL(aFolder) {
    if (!this.showFolders || aFolder == "Private messages") {
        return this.inboxURL;
    }
    return this.viewURL;
}
