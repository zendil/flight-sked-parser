module.exports = parseFile;

const pdfreader = require("pdfreader");

function parseFlights(item, flights) {
	//console.log(item);
	switch(item.text.trim()) {
		case "":
		break;
		case "LINE":
		case "LIN":
			flights.headers.line.startx = item.x
		break;
		case "BRIEF":
			flights.headers.brief.startx = item.x
		break;
			case "SCHD":
			if(flights.headers.land.startx) flights.headers.duration.startx = item.x
			else if(flights.headers.takeoff.startx) flights.headers.land.startx = item.x
			else flights.headers.takeoff.startx = item.x
		break;
		case "INSTRUCTOR":
			flights.headers.instructor.startx = item.x
		break;
		case "STUDENT":
			flights.headers.student.startx = item.x
		break;
		case "TYPE":
			flights.headers.event.startx = item.x
		break;
		case "REMARKS":
			flights.headers.notes.startx = item.x
		break;
		default:
			if(!flights.headers.notes.startx) break;
			if(item.text.match(/^T\d{2}/) != null && item.x <= flights.headers.line.startx) {
				//new event line
				flights.list.push({line: item.text});
				flights.meta.cury = item.y;
			}
			else if(flights.list.length === 0) break;
			else {
				for(let i = 0; i < flights.meta.allcols.length; i++) {
					//Loop through all columns
					if(!flights.meta.cury) flights.meta.cury = item.y //If current y (row) is not set, use current
					if(!flights.meta.allcols[i+1] || item.x < flights.headers[flights.meta.allcols[i+1]].startx - flights.meta.tol) {
						//if we have not set next column OR current item x (col) is less than next column x
						if(!flights.list[flights.list.length-1][flights.meta.allcols[i]]) flights.list[flights.list.length-1][flights.meta.allcols[i]] = ""; //If column is undefined set to empty string
						if(item.y > flights.meta.cury && flights.list[flights.list.length-1][flights.meta.allcols[i]] != "") {
							//If we went to a new line, add \n and reset cury
							flights.list[flights.list.length-1][flights.meta.allcols[i]] = flights.list[flights.list.length-1][flights.meta.allcols[i]]+"\n";
							flights.meta.cury = item.y;
						}
						else {
							//Otherwise cury is our item's y'
							flights.meta.cury = item.y;
						}
						//Set the value of this column to the text of this column
						flights.list[flights.list.length-1][flights.meta.allcols[i]] = flights.list[flights.list.length-1][flights.meta.allcols[i]]+item.text.trim();
						break;
					}
				}
			}
		break;
	}
}

function parseSims(item, sims) {
	//console.log(item);
	switch(item.text.trim()) {
		case "":
		break;
		case "LINE":
			sims.headers.line.startx = item.x
		break;
		case "BRIEF":
			sims.headers.brief.startx = item.x
		break;
		case "SCHD":
			sims.headers.takeoff.startx = item.x
		break;
		case "SIM/DEVICE":
			sims.headers.device.startx = item.x
		break;
		case "INSTRUCTOR":
			sims.headers.instructor.startx = item.x
		break;
		case "STUDENT":
			sims.headers.student.startx = item.x
		break;
		case "TYPE":
			sims.headers.event.startx = item.x
		break;
		case "ACTUAL TIME":
			sims.headers.duration.startx = item.x
		break;
		case "REMARKS":
			sims.headers.notes.startx = item.x
		break;
		default:
			if(!sims.headers.notes.startx) break;
			if(item.text.match(/^(L\dU\d|PTT\d{2})/) != null && item.x <= sims.headers.line.startx) {
				//new event line
				sims.list.push({line: item.text});
				sims.meta.cury = item.y;
			}
			else if(sims.list.length === 0) break;
			else {
				for(let i = 0; i < sims.meta.allcols.length; i++) {
					if(!sims.meta.cury) sims.meta.cury = item.y
					if(!sims.meta.allcols[i+1] || item.x < sims.headers[sims.meta.allcols[i+1]].startx - sims.meta.tol) {
						//if(sims.meta.allcols[i] == "instructor" && item.x >= sims.headers[sims.meta.allcols[i+1]].startx) continue;
						if(!sims.list[sims.list.length-1][sims.meta.allcols[i]]) sims.list[sims.list.length-1][sims.meta.allcols[i]] = "";
						if(item.y > sims.meta.cury && sims.list[sims.list.length-1][sims.meta.allcols[i]] != "") {
							sims.list[sims.list.length-1][sims.meta.allcols[i]] = sims.list[sims.list.length-1][sims.meta.allcols[i]]+"\n";
							sims.meta.cury = item.y;
						}
						else {
							sims.meta.cury = item.y;
						}
						sims.list[sims.list.length-1][sims.meta.allcols[i]] = sims.list[sims.list.length-1][sims.meta.allcols[i]]+item.text.trim();
						break;
					}
				}
			}
		break;
	}
}

function parseGrounds(item, grounds) {
	//console.log(item);
	switch(item.text.trim()) {
		case "":
		case "Meetings":
		case "MIL":
		case "Exam":
		break;
		case "Time":
			grounds.headers.time.startx = item.x
		break;
		case "Event":
			grounds.headers.event.startx = item.x
		break;
		case "Location":
			grounds.headers.location.startx = item.x
		break;
		case "Instructor":
			grounds.headers.instructor.startx = item.x
		break;
		case "Student":
			grounds.headers.student.startx = item.x
		break;
		case "Remarks":
			grounds.headers.notes.startx = item.x
		default:
			if(!grounds.headers.notes.startx) break;
			if(item.text.match(/^\d{4}/) != null && item.x <= grounds.headers.time.startx) {
				//new event line
				grounds.list.push({time: item.text});
				grounds.meta.cury = item.y;
			}
			else if(grounds.list.length === 0) break;
			else {
				for(let i = 0; i < grounds.meta.allcols.length; i++) {
					if(!grounds.meta.cury) grounds.meta.cury = item.y
					if(!grounds.meta.allcols[i+1] || item.x < grounds.headers[grounds.meta.allcols[i+1]].startx - grounds.meta.tol) {
						//if(grounds.meta.allcols[i] == "instructor" && item.x >= grounds.headers[grounds.meta.allcols[i+1]].startx) continue;
						if(!grounds.list[grounds.list.length-1][grounds.meta.allcols[i]]) grounds.list[grounds.list.length-1][grounds.meta.allcols[i]] = "";
						if(item.y > grounds.meta.cury && grounds.list[grounds.list.length-1][grounds.meta.allcols[i]] != "") {
							grounds.list[grounds.list.length-1][grounds.meta.allcols[i]] = grounds.list[grounds.list.length-1][grounds.meta.allcols[i]]+" ";
							grounds.meta.cury = item.y;
						}
						else {
							grounds.meta.cury = item.y;
						}
						grounds.list[grounds.list.length-1][grounds.meta.allcols[i]] = grounds.list[grounds.list.length-1][grounds.meta.allcols[i]]+item.text.trim();
						break;
					}
				}
			}
		break;
	}
}

function parseFile(buffer) {
	return new Promise((resolve, reject) => {
		let flights = {
			meta: {
				cury: undefined,
				allcols : ["line", "brief", "takeoff", "land", "instructor", "student", "event", "duration", "notes"],
				tol: 0.2
			},
			headers: {
				line: {},
				brief: {},
				takeoff: {},
				land: {},
				instructor: {},
				student: {},
				event: {},
				duration: {},
				notes: {},
			},
			list: []
		};
		let sims = {
			meta: {
				cury: undefined,
				allcols : ["line", "brief", "takeoff", "device", "instructor", "student", "event", "duration", "notes"],
				tol: 0.2
			},
			headers: {
				line: {},
				brief: {},
				takeoff: {},
				device: {},
				instructor: {},
				student: {},
				event: {},
				duration: {},
				notes: {},
			},
			list: []
		};
		let grounds = {
			meta: {
				cury: undefined,
				allcols : ["time", "event", "location", "instructor", "student", "notes"],
				tol: 0.5
			},
			headers: {
				time: {},
				event: {},
				location: {},
				instructor: {},
				student: {},
				notes: {},
			},
			list: []
		};
		
		let onFlights = false;
		let onSims = false;
		let onGrounds = false;

		try {new pdfreader.PdfReader().parseBuffer(buffer, (err, item) => {
				if(err) {
					console.log("Parse Error");
					reject(err);
				}
				//console.log(item);
				if(!item) {
					//end of file
					//console.log(flights);
					//console.log(sims);
					//console.log(grounds);
					flights.list.forEach((e) => {
						e.student = e.student.split("\n");
						e.event = e.event.split("\n");
					});
					sims.list.forEach((e) => {
						e.student = e.student.split("\n");
						e.event = e.event.split("\n");
					});
					grounds.list.forEach((e) => {
						let ret = e.time.matchAll(/(?<start>\d{4})-(?<end>\d{4})/g).next().value
						//console.log(ret);
						if(!ret) {
							e.start = e.time.substr(0, 4);
							e.end = (Math.valueOf(e.start)+100).toString();
						}
						else {
							e.start = ret.groups.start;
							e.end = ret.groups.end;
						}
					});
					flights.list.forEach((e) => {
						flights.meta.allcols.forEach((f) => {
							if(!e[f]) {
								e[f] = null;
							}
						});
					});
					sims.list.forEach((e) => {
						sims.meta.allcols.forEach((f) => {
							if(!e[f]) {
								e[f] = null;
							}
						});
					});
					grounds.list.forEach((e) => {
						grounds.meta.allcols.forEach((f) => {
							if(!e[f]) {
								e[f] = null;
							}
						});
					});
					console.log(flights);
					console.log(sims);
					console.log(grounds);
					resolve({
						flights: flights,
						sims: sims,
						grounds: grounds,
					});
				}
				else if(!item.text) {
					//new page or other non text item
				}
				else if(item.text.trim() == "Flight (Flight Event) Schedule") {
					onFlights = true;
					onSims = false;
					onGrounds = false;
				}
				else if(item.text.trim() == "Simulator (Sim Event)" || item.text.trim() == "Simulator (Sim Event) Schedule") {
					onFlights = false;
					onSims = true;
					onGrounds = false;
				}
				else if(item.text.trim() == "Ground Events") {
					onFlights = false;
					onSims = false;
					onGrounds = true;
				}
				else {
					if(onFlights) {
						//console.log("on flights");
						parseFlights(item, flights);
					}
					else if(onSims) {
						//console.log("on sims");
						parseSims(item, sims);
					}
					else if(onGrounds) {
						//console.log("on grounds");
						parseGrounds(item, grounds);
					}
					else {
						
					}
				}
			});
		}
		catch (e) {
			console.log("PDF Error");
		}
	});
}
