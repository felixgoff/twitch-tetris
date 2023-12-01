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

async function highScoresOnLoad() {

	dailyOutput= '<table class="highScoreTable"><tr class="highScoreTableHeader"><td>#</td><td>Date</td><td>Score</td></tr>';
	array = []
	scorearr = []
	data = localStorage.highscore.split(",")
    for (i in data){
        array.push(data[i])
	}
	console.log(array)
	dailyScoreList = array.sort(function(a, b){
		x = JSON.parse(JSON.parse(JSON.stringify(b.replaceAll("'",","))))
		y = JSON.parse(JSON.parse(JSON.stringify(a.replaceAll("'",","))))
		return x.score - y.score
	});
	for (i = 0; i < dailyScoreList.length; i += 1) {
		data = JSON.parse(JSON.parse(JSON.stringify(dailyScoreList[i].toString().replaceAll("'",","))))
		console.log(data)
		Score = data.score
		Date = data.date
		scorearr.push(Score)
		dailyOutput += '<tr><td>' + (i+1) + '</td><td>' + Date + '</td><td>' + Score + '</td></tr>';
	}
	Average = Number((scorearr.reduce((a, b) => a + b, 0) / scorearr.length).toString().substring(0, 5))
	console.log("Average: "+Average)
	dailyOutput += '</table>';
	
	document.getElementById("dailyScoreDiv").innerHTML = dailyOutput;
}
