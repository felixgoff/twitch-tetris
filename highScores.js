import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js'
import { getDatabase , set , ref, query, orderByChild , get} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js'
// If you enabled Analytics in your project, add the Firebase SDK for Google Analytics
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js'

const firebaseConfig = {
    apiKey: "AIzaSyB99fB1K3gbPsCBf42wljTGF586pEfrvlw",
    authDomain: "ghpages-366608.firebaseapp.com",
    databaseURL: "https://ghpages-366608-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ghpages-366608",
    storageBucket: "ghpages-366608.appspot.com",
    messagingSenderId: "459313808683",
    appId: "1:459313808683:web:c71eefbdc9d185f358716e",
    measurementId: "G-XRSSS9G1J3"
  };

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return [d.getUTCFullYear(), weekNo];
}

function getXmlHttp() {
    if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
	return new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
	return new ActiveXObject("Microsoft.XMLHTTP");
    }
}
function saveUsername() {
	localStorage.username = document.getElementById("name").value
	console.log("j")
	console.log(document.getElementById("name").value)
}
async function updateOnlineScores(weeklyScoreList) {
	var weeklyOutput = '<table class="highScoreTable"><tr class="highScoreTableHeader"><td>#</td><td>Date</td><td>Name</td><td>Score</td></tr>'
	for (var h = 0; h < weeklyScoreList.length; h += 1) {
		var data2 = weeklyScoreList[h]
		const Name2 = data2.name
		const Score2 = data2.score
		const Date2 = data2.date
		weeklyOutput += '<tr><td>' + (h+1) + '</td><td>' + Date2 + '</td><td>' + Name2 + '</td><td>' + Score2 + '</td></tr>';
	}
	weeklyOutput += '</table>';
	document.getElementById("weeklyScoreDiv").innerHTML = weeklyOutput
}
async function setOnlineHighScores(data) {
  if (typeof data.isodate == "undefined") {return}
  console.log(getWeekNumber(new Date(data.isodate)))
  document.getElementById("name").value = localStorage.username
  const username = document.getElementById("name").value
  const db = getDatabase();
  var result = getWeekNumber(new Date(data.isodate))
  if (!username){return}
  set(ref(db, 'weeks/' +result[0]+ "-" +result[1]+ "/" + data.score), {
	score: data.score,
	name: username,
	date: data.date,
	isodate: data.isodate
})
}
async function getOnlineHighScores() {
const db = getDatabase();
const scoreLists = query(ref(db, 'weeks/'+getWeekNumber(new Date())[0]+"-"+getWeekNumber(new Date())[1]), orderByChild("score"));
const postarray = []
get(scoreLists).then((snapshot) => {
	if (snapshot.exists()) {
		snapshot.forEach(post => {
			postarray.push(post.val())
		});
		var weeklyScoreList = postarray.sort(function(t, y){
			return t.score - y.score
		}).reverse();
		updateOnlineScores(weeklyScoreList)
	} else {
		console.log("No data available");
	}
}).catch((error) => {
		console.error(error);
});
}
async function highScoresOnLoad() {
	document.getElementById("name").value = localStorage.username
	var dailyOutput = '<table class="highScoreTable"><tr class="highScoreTableHeader"><td>#</td><td>Date</td><td>Score</td></tr>'
	var array = []
	let data
	const scorearr = []
	try {
		data = atob(localStorage.highscore).split(",");
	} catch (error) {
		localStorage.highscore = btoa(localStorage.highscore)
		data = atob(localStorage.highscore).split(",")
	}
	console.log(data)
    for (var i in data){
        array.push(data[i])
	}
	console.log(array)
	var x
	var y
	await getOnlineHighScores()
	var dailyScoreList = array.sort(function(a, b){
		x = JSON.parse(JSON.parse(JSON.stringify(b.replaceAll("'",","))))
		y = JSON.parse(JSON.parse(JSON.stringify(a.replaceAll("'",","))))
		return x.score - y.score
	});
	for (var i = 0; i < dailyScoreList.length; i += 1) {
		data = JSON.parse(JSON.parse(JSON.stringify(dailyScoreList[i].toString().replaceAll("'",","))))
		setOnlineHighScores(data)
		const Score = data.score
		const Date = data.date

		if (Score > 50){
			scorearr.push(Number(Score))
			dailyOutput += '<tr><td>' + (i+1) + '</td><td>' + Date + '</td><td>' + Score + '</td></tr>';
		}
	}
	const Average = Number((scorearr.reduce((a, b) => a + b, 0) / scorearr.length).toString().substring(0, 5))
	console.log("Average: "+Average)
	dailyOutput += '</table>';
	document.getElementById("dailyScoreDiv").innerHTML = dailyOutput;
	document.getElementById("average").innerHTML = "Average: "+Average;
}
document.body.onload = highScoresOnLoad()
document.getElementById("savename").onclick = saveUsername
