// Set to ParsingApi to use API else set to ParsingHtml to scrap HTML
var Parsing = ParsingHtml;

function updateProgress(progress, doujinshiName) {
    if (progress === 100)
        document.getElementById('action').innerHTML = 'You files are being downloaded, thanks for using NHentaiDownloader.';
    else
    {
        document.getElementById('action').innerHTML = 'Downloading ' + doujinshiName + ', please wait...<br/><progress max="100" id="progressBar" value="' + progress + '"></progress>' +
        '<br/><br/><input type="button" id="buttonBack" value="Go back"/>';
        document.getElementById('buttonBack').addEventListener('click', function()
        {
            chrome.extension.getBackgroundPage().goBack();
            updatePreview(currUrl);
        });
    }
}

var currUrl;

function updatePreview(url) {
    let match = /https:\/\/nhentai.net\/g\/([0-9]+)\/([/0-9a-z]+)?/.exec(url)
    if (match !== null)
    {
        let http = new XMLHttpRequest();
        http.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    let json = JSON.parse(Parsing.GetJson(this.responseText));
                    document.getElementById('action').innerHTML = '<h3 id="center">' + json.title.pretty + '</h3><div id="center">(' + json.images.pages.length + ' pages)' +
                    '</div><br/><input type="button" id="button" value="Download"/><br/><br/>Downloads/<input type="text" id="path"/> .zip';
                    let cleanName = "";
                    json.title.pretty.split('').forEach (function(e) {
                        if ((e >= 'a' && e <= 'z') || (e >= 'A' && e <= 'Z') || (e >= '0' && e <= '9') || e === '-' || e === '_')
                            cleanName += e;
                        else if (e === ' ')
                            cleanName += '_';
                    });
                    cleanName = cleanName.replace(/_+/g, '_');
                    document.getElementById('path').value = cleanName;
                    document.getElementById('button').addEventListener('click', function()
                    {
                        chrome.extension.getBackgroundPage().download(json, document.getElementById('path').value, function(error) {
                            document.getElementById('action').innerHTML = 'An error occured while downloading the doujinshi: <b>' + error + '</b>';
                        }, updateProgress, json.title.pretty);
                        updateProgress(0, json.title.pretty);
                    });
                } else if (this.status === 403) {
                    document.getElementById('action').innerHTML = "This extension must be used on a doujinshi page in nhentai.net.";
                } else {
                    document.getElementById('action').innerHTML = "An unexpected error occured (Code " + this.status + ").";
                }
            }
        };
        http.open("GET", Parsing.GetUrl(match[1]), true);
        http.send();
    }
    else
        document.getElementById('action').innerHTML = "This extension must be used on a doujinshi page in nhentai.net.";
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    currUrl = tabs[0].url;
    if (!chrome.extension.getBackgroundPage().isDownloadFinished()) {
        chrome.extension.getBackgroundPage().updateProgress(updateProgress);
        return;
    }
    updatePreview(currUrl);
});