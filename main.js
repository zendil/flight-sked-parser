const fs = require("node:fs");
const parseFile = require("./parse.js");
const addEvent = require("./calendar.js");
const fetchSked = require("./fetch.js");

let auth = false;

let name = "LT PETERSON E";

//LOCAL MACHINE TIME MUST BE IN TIME ZONE OF THE SCHEDULE (America/Chicago)
let tzval = Math.round(new Date().getTimezoneOffset() / 60 * -1);
let tz;
if(tzval > 0) {
	tz = "+"+tzval.toString().padStart(2, "0")+":00";
}
else if(tzval < 0) {
	tz = "-"+Math.abs(tzval).toString().padStart(2, "0")+":00";
}
else tz = "Z";
//console.log(tz);

let fetched = {};

let firstday = new Date(Date.now() + 24 * 60 * 60 * 1000);
//while(firstday.getDay() == 0 || firstday.getDay() == 6) {
//	//Sun and Sat
//	firstday = new Date(firstday.valueOf() + 24 * 60 * 60 * 1000);
//}
let firstdate = firstday.getFullYear().toString().padStart(2, "0")+"-"+(firstday.getMonth()+1).toString().padStart(2, "0")+"-"+(firstday.getDate()+0).toString().padStart(2, "0");
//firstdate = "2025-12-02";
//fetched["2025-11-11"] = true;

runDate(firstdate);

function setNextRun() {
	let today = new Date((Date.now() - (tzval * 60 * 60 * 1000)));
	let tomorrow = new Date((Date.now() + (24 * 60 * 60 * 1000) - (tzval * 60 * 60 * 1000)));
	today = today.getFullYear().toString().padStart(2, "0")+"-"+(today.getMonth()+1).toString().padStart(2, "0")+"-"+(today.getDate()+0).toString().padStart(2, "0");
	tomorrow = tomorrow.getFullYear().toString().padStart(2, "0")+"-"+(tomorrow.getMonth()+1).toString().padStart(2, "0")+"-"+(tomorrow.getDate()+0).toString().padStart(2, "0");
	//today = "2025-11-11";
	//tomorrow = "2025-11-12";
	let goaltime;
	//console.log(fetched);
	if(!fetched[today] || fetched[today] === false) {
		//Need todays schedule
		goaltime = Math.ceil(Date.now() / (30 * 60 * 1000)) * (30 * 60 * 1000);
		//console.log("goal1:"+goaltime);
	}
	else if(!fetched[tomorrow] || fetched[tomorrow] === false) {
		//Need tomorrows schedule
		goaltime = Math.ceil(Date.now() / (30 * 60 * 1000)) * (30 * 60 * 1000);
		//console.log("goal2:"+goaltime);
	}
	else {
		//Need a future (not today or tomorrow) schedule
		//let goaltime = Math.ceil(curtime / (10 * 1000)) * (10 * 1000); //10 secs for test
		//console.log(curtime, goaltime);
		let nextday = new Date(Date.now() + 24 * 60 * 60 * 1000);
		while(nextday.getDay() == 0 || nextday.getDay() == 6) {
			//Sun and Sat
			nextday = new Date(nextday.valueOf() + 24 * 60 * 60 * 1000);
		}
		let formatednext = nextday.getFullYear().toString().padStart(2, "0")+"-"+(nextday.getMonth()+1).toString().padStart(2, "0")+"-"+(nextday.getDate()+0).toString().padStart(2, "0");
		//console.log("next1:"+formatednext);
		while(fetched[formatednext] && fetched[formatednext] === true) {
			//console.log("nextcheck:"+formatednext+":true");
			nextday = new Date((Date.parse(formatednext) - (tzval * 60 * 60 * 1000)) + 24 * 60 * 60 * 1000);
			while(nextday.getDay() == 0 || nextday.getDay() == 6) {
				//Sun and Sat
				nextday = new Date(nextday.valueOf() + 24 * 60 * 60 * 1000);
			}
			formatednext = nextday.getFullYear().toString().padStart(2, "0")+"-"+(nextday.getMonth()+1).toString().padStart(2, "0")+"-"+(nextday.getDate()+0).toString().padStart(2, "0");
			//console.log("next2:"+formatednext);
			goaltime = Math.ceil((Date.parse(formatednext) - (tzval * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000) - (-1 * tzval * 60 * 60 * 1000);
			//console.log("goal3:"+goaltime);
		}
		goaltime = goaltime - 24 * 60 * 60 * 1000;
		//console.log("goal4:"+goaltime);
		//console.log("nextcheck:"+formatednext+":false");
		//console.log(formatednext);
		//console.log(fetched);
		//if(fetched[formatednext] === true) {
		//	//already got this day
		//	console.log("date "+formatednext+" already fetched");
		//	goaltime = Math.ceil((Date.parse(formatednext) - (tzval * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000) - (-1 * tzval * 60 * 60 * 1000);
		//}
	}
	//console.log("goal end:"+goaltime);
	let timer = goaltime - Date.now();
	let goalstring = new Date(goaltime).toISOString();
	console.log("set next run for "+goalstring+" -- "+((goaltime - Date.now()) / 1000)+" secs remaining");
	setTimeout(() => {
		runDate(formatednext || today);
	}, timer);
}



// fs.readFile("test1.pdf", (err, data) => {
	// console.log(data);
	// parseFile(data);
// });

// return false;

async function runDate(date) {
	//format date object as YYYY-MM-DD
	let formatDate = date.getFullYear().toString()+"-"+(date.getMonth()+1).toString().padStart(2, "0")+"-"+(date.getDate()+0).toString().padStart(2, "0");
	console.log("fetching date "+formatDate);
	fetchSked(formatDate).then((pdfBuffer) => {
		parseFile(pdfBuffer).then((sked) => {
			//console.log(sked.flights.list);
			sked.flights.list.forEach((event) => {
				let details = {};
				if(event.instructor && event.instructor.indexOf(name) !== -1) {
					console.log("brief:"+event.brief);
					if(event.event === null) event.event = ["Unknown"]; //If null set to unknown
					if(event.brief === null) event.brief = new Date(formatDate+"T00:00:00"+tz);
					else event.brief = new Date(formatDate+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz);
					if(event.land === null) event.land = new Date(formatDate+"T23:59:59"+tz);
					else event.land = new Date(formatDate+"T"+event.land.substr(0,2)+":"+event.land.substr(2,2)+":00"+tz);
					if(event.event === null) event.event = "None"; //If null set to none
					details = {
						summary: event.event.join(", "),
						start: event.brief,
						end: event.land,
						description: event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student[0] && event.student[0].indexOf(name) !== -1) {
					details = {
						summary: event.event[0],
						start: new Date(formatDate+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(formatDate+"T"+event.land.substr(0,2)+":"+event.land.substr(2,2)+":00"+tz),
						description: "IP "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student[1] && event.student[1].indexOf(name) !== -1) {
					details = {
						summary: event.event[1],
						start: new Date(formatDate+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(formatDate+"T"+event.land.substr(0,2)+":"+event.land.substr(2,2)+":00"+tz),
						description: "IP "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student[2] && event.student[2].indexOf(name) !== -1) {
					details = {
						summary: event.event[2],
						start: new Date(formatDate+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(formatDate+"T"+event.land.substr(0,2)+":"+event.land.substr(2,2)+":00"+tz),
						description: "IP "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
			});
			
			//console.log(sked.sims.list);
			sked.sims.list.forEach((event) => {
				//console.log(event);
				if(event.device !== null && event.line !== null && (event.device.substr(0, 3) == "PTT" || event.line.substr(0,3) == "PTT")) event.notes = "PTT\n"+event.notes;
				if(!event.instructor) event.instructor = "TBD";
				if(!event.notes) event.notes = "";
				if(event.brief == "TBD") event.brief = event.takeoff;
				let details = {};
				if(event.instructor && event.instructor.indexOf(name) !== -1) {
					details = {
						summary: event.event.join(", "),
						start: new Date(formatDate+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(new Date(formatDate+"T"+event.takeoff.substr(0,2)+":"+event.takeoff.substr(2,2)+":00"+tz).getTime() + event.duration * 60 * 60 * 1000),
						description: event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student[0] && event.student[0].indexOf(name) !== -1) {
					//console.log(event);
					details = {
						summary: event.event[0],
						start: new Date(formatDate+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(new Date(formatDate+"T"+event.takeoff.substr(0,2)+":"+event.takeoff.substr(2,2)+":00"+tz).getTime() + event.duration * 60 * 60 * 1000),
						description: "IP "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student[1] && event.student[1].indexOf(name) !== -1) {
					details = {
						summary: event.event[1],
						start: new Date(formatDate+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(new Date(formatDate+"T"+event.takeoff.substr(0,2)+":"+event.takeoff.substr(2,2)+":00"+tz).getTime() + event.duration * 60 * 60 * 1000),
						description: "IP "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
			});
			
			//console.log(sked.grounds.list);
			sked.grounds.list.forEach((event) => {
				if(!event.instructor) event.instructor = "TBD";
				if(!event.notes) event.notes = "";
				let details = {};
				if(event.instructor && event.instructor.indexOf(name) !== -1) {
					details = {
						summary: event.event,
						start: new Date(formatDate+"T"+event.time.substr(0,2)+":"+event.time.substr(2,2)+":00"+tz),
						end: new Date(formatDate+"T"+event.time.substr(4,2)+":"+event.time.substr(6,2)+":00"+tz),
						description: event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student && event.student.indexOf(name) !== -1) {
					//console.log(event);
					details = {
						summary: event.event,
						start: new Date(formatDate+"T"+event.time.substr(0,2)+":"+event.time.substr(2,2)+":00"+tz),
						end: new Date(formatDate+"T"+event.time.substr(5,2)+":"+event.time.substr(7,2)+":00"+tz),
						description: "Instructor "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
			});
			fetched[formatDate] = true;
			//console.log("fetched "+formatDate+" true");
			
			//try the next day too
			let nextday = new Date(Date.parse(date) - (tzval * 60 * 60 * 1000) + 24 * 60 * 60 * 1000);
			while(nextday.getDay() == 0 || nextday.getDay() == 6) {
				//Sun and Sat
				nextday = new Date(nextday.valueOf() + 24 * 60 * 60 * 1000);
			}
			let formatednext = nextday.getFullYear().toString().padStart(2, "0")+"-"+(nextday.getMonth()+1).toString().padStart(2, "0")+"-"+(nextday.getDate()+0).toString().padStart(2, "0");
			console.log("checking next day ("+formatednext+")");
			runDate(formatednext);
			setNextRun(true, date);
		});
	}).catch((e) => {
		fetched[formatDate] = false;
		//console.log("fetched "+formatDate+" false");
		console.log("ERROR: "+e);
		setNextRun(false, date);
	});
}

function tzDate(datetime, timezoneName) {
	if(datetime.substring(datetime.length - 1, datetime.length).toUpperCase != "Z") datetime += "Z";
	let date = new Date(datetime);

	let utcDate = new Date(date.toLocaleString('en-US', { timeZone: "UTC" }));
	let tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezoneName }));
	let offset = utcDate.getTime() - tzDate.getTime();

	date.setTime(date.getTime() + offset);

	return date;
}
