var pingsWithoutResponse = 0;
var outstandingPingTimeout;

function readNewbox(bytes, start, db1, db2) {
	var pokemon = [];
	var banks = [];
	for (var i = 0; i < 3; i++) {
		var b = bytes[start + 0x14 + i];
		for (var j = 0; j < 8; j++) {
			banks.push((b & 1) == 1);
			b >>= 1;
		}
	}
	for (var i = 0; i < 20; i++) {
		var b = bytes[start + i];
		if (b == 0) {
			continue;
		}
		b--;
		var p = db1;
		if (banks[i]) {
			p = db2;
		}
		p += b * 0x2F;
		if (bytes[p + 0x1d] == 0xfd) { // Egg
			continue;
		}
		var item = bytes[p + 0x01];
		if (itemsById.has(item)) {
			item = itemsById.get(item);
		} else {
			item = "";
		}
		var atk = (bytes[p + 0x15] & 0xf0) >> 4;
		var def = (bytes[p + 0x15] & 0x0f);
		var spe = (bytes[p + 0x16] & 0xf0) >> 4;
		var spa = (bytes[p + 0x16] & 0x0f);
		var spd = spa
		var hp = 8 * (atk & 0b1) + 4 * (def & 0b1) + 2 * (spe & 0b1) + (spa & 0b1);
		var moves = [];
		for (var j = 0; j < 4; j++) {
			var move = bytes[p + 0x02 + j];
			if (movesByIndex.has(move)) {
				moves.push(movesByIndex.get(move).name);
			}
		}
		var caught = bytes[p + 0x1B] & 0b0111_1111;
		var landmark = landmarksByIndex.get(caught);
		if (!landmark) {
			landmark = "unknown";
		} else {
			landmark = landmark.name;
		}
		pokemon.push({
			name: pokemonByPokedex.get(bytes[p]).name,
			level: bytes[p + 0x1c],
			dvs: {
				"hp": hp,
				"atk": atk,
				"def": def,
				"spa": spa,
				"spd": spd,
				"spe": spe
			},
			"moves": moves,
			"item": item,
			"caught": landmark
		});
	}
	return pokemon;
}

function readPokemonList(bytes, start, capacity, increment) {
	var count = bytes[start];
	var p = start + 1;
	var species = [];
	for (var i = 0; i < count; i++) {
		species.push(bytes[p + i]);
	}
	/* Terminator was broken for a patch
	if (bytes[p + count] != 0xff) {
		return;
	}*/
	p += capacity + 1;
	var pokemon = [];
	for (var i = 0; i < count; i++) {
		species[i].level = bytes[p + 0x1f];
		if (bytes[p] != species[i]) { // Mismatching species or egg
			continue;
		}
		var item = bytes[p + 0x01];
		if (itemsById.has(item)) {
			item = itemsById.get(item);
		} else {
			item = "";
		}
		var atk = (bytes[p + 0x15] & 0xf0) >> 4;
		var def = (bytes[p + 0x15] & 0x0f);
		var spe = (bytes[p + 0x16] & 0xf0) >> 4;
		var spa = (bytes[p + 0x16] & 0x0f);
		var spd = spa
		var hp = 8 * (atk & 0b1) + 4 * (def & 0b1) + 2 * (spe & 0b1) + (spa & 0b1);
		var moves = [];
		for (var j = 0; j < 4; j++) {
			var move = bytes[p + 0x02 + j];
			if (movesByIndex.has(move)) {
				moves.push(movesByIndex.get(move).name);
			}
		}
		var caught = bytes[p + 0x1E] & 0b0111_1111;
		var landmark = landmarksByIndex.get(caught);
		if (!landmark) {
			landmark = "unknown";
		} else {
			landmark = landmark.name;
		}
		pokemon.push({
			name: pokemonByPokedex.get(bytes[p]).name,
			level: bytes[p + 0x1f],
			dvs: {
				"hp": hp,
				"atk": atk,
				"def": def,
				"spa": spa,
				"spd": spd,
				"spe": spe
			},
			"moves": moves,
			"item": item,
			"caught": landmark
		});
		p += increment;
	}
	return pokemon;
}

function parseBadges(badgeMask) {
	badges = 0;
	for (var i = 0; i < 16; i++) {
		if ((badgeMask & 1) == 1) {
			badges++;
		}
		badgeMask >>= 1;
	}
	document.getElementById("badges").value = badges;
	updateBadges();
}

function finishParse(title, pokemon, deadPokemon) {
	if (box.length > 0) {
		setPlayer(0);
	}
	updateBox();
	var popup = '<div onclick="closePopup()" class="save-success">' + title;
	popup += '<lb></lb>Encounters: ' + pokemon.length;
	if (deadPokemon.length > 0) {
		popup += ' (+' + deadPokemon.length + ' fainted)';
	}
	popup += '<lb></lb>Badges: ' + badges;
	popup += '</div>';
	document.getElementById("info-popup").innerHTML = popup;
}

function readFile(file) {
	var reader = new FileReader();
	reader.onload = function (e) {
		var bytes = new Uint8Array(e.target.result);
		if (bytes.length > 32000 && bytes[0x2008] == 99 && bytes[0x2d0f] == 127) {
			try {
				var pokemon = [];
				var deadPokemon = [];
				pokemon = pokemon.concat(readPokemonList(bytes, 0x2865, 6, 48));
				for (var i = 0; i < 16; i++) {
					var l = readNewbox(bytes, 0x2f20 + i * 0x21, 0x4000, 0x6000);
					if (i >= 12) {
						deadPokemon = deadPokemon.concat(l);
					} else {
						pokemon = pokemon.concat(l);
					}
				}
				box = pokemon;
				deadBox = deadPokemon;
				parseBadges((bytes[0x23e5] << 8) | bytes[0x23e6]);
				finishParse("Successfully parsed save!", pokemon, deadPokemon);
			} catch (e) {
				console.log(e);
				document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-error">Error while parsing save!<lb></lb>Is this a valid file?<lb></lb>See console for details</div>';
			}
		} else {
			if (file.name.endsWith(".json")) {
				try {
					var text = new TextDecoder().decode(bytes);
					var j = JSON.parse(text);
					localStorage.setItem("calc/custom-data", text);
					document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-success">Successfully parsed JSON<lb></lb>Loaded as custom game</div>';
				} catch (e) {
					console.log(e);
					document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-error">Error while parsing JSON!<lb></lb>Is this a valid file?<lb></lb>See console for details</div>';
				}
				return;
			}
			console.log("File doesn't appear to be a save file!");
			console.log(bytes[0x2008]);
			console.log(bytes[0x2d0f]);
			document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-error">File doesn\'t appear to be a save file!<lb></lb>Name should end with .sav</div>';
		}
	};
	reader.readAsArrayBuffer(file);
}

function hexToBytes(hex) {
    var bytes = [];
    for (var c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}
