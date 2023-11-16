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

function highScoresOnLoad() {
	dailyOutput,
	i;

	dailyOutput= '<table class="highScoreTable"><tr class="highScoreTableHeader"><td>#</td><td>Name</td><td>Score</td></tr>';
	dailyScoreList = JSON.parse(localStorage.highscore)
	for (i = 0; i < dailyScoreList.length; i += 1) {
	curScore = dailyScoreList[i];
	dailyOutput += '<tr><td>' + (i+1) + '</td><td>' + curScore + '</td></tr>';
	}

	dailyOutput += '</table>';

	document.getElementById("dailyScoreDiv").innerHTML = dailyOutput;

