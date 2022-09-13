let time_left = document.getElementById("time_left");
let num_ac = document.getElementById("num_solved");
let label_for_bar = document.getElementById("label");
let bar = document.getElementById("bar");
let goal = document.getElementById("goal");
let goal_selected = document.getElementById("goal_selected");
let target = 5;
const body = document.querySelector(".container");
let prob_links = document.getElementById("WA_probs");
let recommended_probs = document.getElementById("Recommended_Probs");
let button = document.getElementById("diff_selected");
let diff = document.getElementById("diff");
let recentContestLink = document.getElementById("recentContestLink");
let handle_selected = document.getElementById("handle_selected");
let handle_options = document.getElementById("handle_options");
let show_handle = document.getElementById("show_handle");
let handle="aldifferento";
show_handle.innerHTML = "Handle selected: <b>" + handle + "</b>";

// Remove this if CORS error not solved
document.addEventListener("DOMContentLoaded",function() {
    var cors_api_host = 'cors-anywhere.herokuapp.com';
    var cors_api_url = 'https://' + cors_api_host + '/';
    var slice = [].slice;
    var origin = window.location.protocol + '//' + window.location.host;
    var open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        var args = slice.call(arguments);
        var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(args[1]);
        if (targetOrigin && targetOrigin[0].toLowerCase() !== origin &&
            targetOrigin[1] !== cors_api_host) {
            args[1] = cors_api_url + args[1];
        }
        return open.apply(this, args);
    };
});
// upto this part

chrome.storage.sync.get(
    ["darkMode"],
    function (items) {
        if (items) {
            const { darkMode } =
                items;
            if (!darkMode) {
                body.classList.remove("dark-mode");
                darkControl.textContent = "Dark mode: Off";
            } else {
                body.classList.add("dark-mode");
                darkControl.textContent = "Dark mode: On";
            }
        }
    }
);

handle_selected.addEventListener("click", () => {
    handle = handle_options.value;
    show_handle.innerHTML = "Handle selected: <b>" + handle + "</b>";
});

goal_selected.addEventListener("click", () => {
    target = goal.value;
});


button.addEventListener("click", async() => {
    let url = "https://cors-anywhere.herokuapp.com/https://recommender.codedrills.io/profile?handles="+handle;
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "document";

    let tar = target;
    let probsNotDone = new Map();
    xhr.onload = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // do something with that HTML page

            let response = xhr.responseXML.getElementById(diff.value).children[2].children[0].children[0].children[0].children;
            for(let i=0;i<response.length && tar;i++){
                let curchild = response[i].children[0].children[0].children[0];
                let link = curchild.getAttribute("href");
                //console.log(link);
                probsNotDone.set(curchild.text, link);
                tar--;
            }
            //console.log(probsNotDone.size);
            recommended_probs.innerHTML="";
            for (const [key, value] of probsNotDone.entries()) {
                let linkToProb = document.createElement("a");
                linkToProb.href = value;
                linkToProb.target = "blank";
                linkToProb.innerHTML = key + "<br/>";
                recommended_probs.appendChild(linkToProb);
            };
        }
    };
    xhr.onerror = function () {
        console.error(xhr.status, xhr.statusText);
    }
    xhr.send();
});

document.addEventListener("DOMContentLoaded", async () => {
    let res = await fetch("https://codeforces.com/api/contest.list?gym=false");
    let data = await res.json();
    let seconds = 0;
    let contestId = -1;
    let agla="next contest"
    for (let i = 0; i < data.result.length; ++i) {
        if (data.result[i].relativeTimeSeconds < 0) {
            agla = data.result[i].name;
            seconds = -data.result[i].relativeTimeSeconds;
            contestId = data.result[i].id;
        }
        else break;
    }
    let link = "https://codeforces.com/contests/"+contestId;
    let linkToProb = document.createElement("a");
    linkToProb.href = link;
    linkToProb.target = "blank";
    linkToProb.innerHTML = agla + "<br/>";
    recentContestLink.appendChild(linkToProb);
    let mins = parseInt(seconds / 60);
    let hrs = parseInt(mins / 60);
    let days = parseInt(hrs / 24);
    // hrs = hrs + 24*days;
    if(days!=0) time_left.innerHTML ="<p>" + (days) + " days, " + (hrs) + " hours, " + (mins % 60) + " minutes left"+"</p>";
    else time_left.innerHTML ="<p>" + (hrs) + " hours, " + (mins % 60) + " minutes left"+"</p>";
});

async function getTarget(){
    let res = await fetch("https://codeforces.com/api/user.status?handle=" + handle + "&from=1&count=50");
    let data = await res.json();
    let all_subs = data.result;
    let cnt = 0, i = 0;
    let cur_date = new Date();
    while (i < 50) {
        let sub_date = new Date(all_subs[i].creationTimeSeconds*1000);
        if (cur_date.getDate() != sub_date.getDate())
            break;
        if (all_subs[i].verdict == "OK")
            cnt++;
        i++;
    }
    if (cnt > target)
        cnt = target;
    let percentage = (cnt * 100) / target;
    label_for_bar.innerText = "Today's Target Completion: " + percentage + "%";
    bar.value = percentage;
    if (cnt < target) num_ac.innerHTML = "You have done " + cnt + " questions... " + (target - cnt) + " more to go!";
    else num_ac.innerHTML = "Congrats! You have completed the target of " + target + " questions today.";
}


async function getWAprobs(){
    let api = await fetch("https://codeforces.com/api/user.status?handle=" + handle + "&from=1&count=50");
    let data = await api.json();
    // data.status returns the status of the request
    let desciption_prob = data.result;
    const acceptedProbs = new Set();
    let i = 0;
    let cnt = 5;
    let probsNotDone = new Map();
    while (i < 50 && cnt > 0) {
        let contestId = desciption_prob[i].problem.contestId;
        let indexProblem = desciption_prob[i].problem.index;
        let idOfProblem = contestId + "/problem/" + indexProblem;
        let problemName = desciption_prob[i].problem.name;
        if (desciption_prob[i].verdict == "OK") {
            acceptedProbs.add(idOfProblem);
        }
        else {
            if (!acceptedProbs.has(idOfProblem) && probsNotDone.get(idOfProblem) == undefined) {
                probsNotDone.set(idOfProblem, { id: contestId, name: problemName });
                cnt--;
            }
        }
        i++;
    }

    //console.log(probsNotDone.size);

    let link;
    prob_links.innerHTML = "";
    for (const [key, value] of probsNotDone.entries()) {
        if (value >= 100000) link = "https://codeforces.com/gym/" + key;
        else link = "https://codeforces.com/contest/" + key;
        let linkToProb = document.createElement("a");
        linkToProb.href = link;
        linkToProb.target = "blank";
        linkToProb.innerHTML = value.name + "<br/>";
        prob_links.appendChild(linkToProb);
    };
}

document.addEventListener("DOMContentLoaded", getTarget);
document.addEventListener("DOMContentLoaded", getWAprobs);
handle_selected.addEventListener("click", getTarget);
handle_selected.addEventListener("click", getWAprobs);
goal_selected.addEventListener("click", getTarget);

const changeTheme = (e) => {
    chrome.storage.sync.get(["darkMode"], function (items) {
        if (items.darkMode) {
            chrome.storage.sync.set({ darkMode: false });
            body.classList.remove("dark-mode");
            darkControl.textContent = "Dark mode: Off";
        } else {
            chrome.storage.sync.set({ darkMode: true });
            body.classList.add("dark-mode");
            darkControl.textContent = "Dark mode: On";
        }
    });
};

let darkControl = document.querySelector(".dark-control");
darkControl.addEventListener("click", (e) => changeTheme(e));
