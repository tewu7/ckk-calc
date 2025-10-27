function displayTrainers() {
	var lastArea = ""
	var v = "";
	for (var i = 0; i < data.trainers.length; i++) {
		var t = data.trainers[i];
		if (isTrainerB2b(i) == false && isTrainerB2b(i + 1) == true) {
			v += `<div class="b2b">`;
		}
		if (t.area != undefined && t.area != lastArea) {
			lastArea = t.area
			var areaName = lastArea;
			if (lastArea.includes("-")) {
				areaName = fullCapitalize(areaName);
			}
			v += "<h2>" + areaName + "</h2>";
		}
		if (t.meta != undefined) {
			v += "<h3>" + t.meta + "</h3>";
		}
		v += getTrainerDisplay(t, i);
		if (isTrainerB2b(i) == true && isTrainerB2b(i + 1) == false) {
			v += `</div>`;
		}
	}
	document.getElementById("trainers").innerHTML = v;
}

function getTrainerDisplay(trainer, i) {
	return `
		<div class="trainer">
			<div>
				${getTrainerName(trainer.name)}
				<button style="float:right;" onclick="calcTrainer(${i})">Calc</button>
				${createLink(`#/trainer/${trainer.name}/`, '<button style="float:right;">Info</button>')}
			</div>
			<div class="trainer-pokes">
				${getTeamDisplay(trainer)}
			</div>
		</div>
	`;
}

function getTeamDisplay(t) {
	return t.team.displayMap(p => getTinyPokemonDisplay(p));
}
