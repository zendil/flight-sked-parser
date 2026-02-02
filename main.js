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
//firstdate = "2026-01-29";

//runDate(firstdate);
runDate(new Date());

function setNextRun(success, date) {
	if(success === true) {
		//successful grab for this date
		//try the next day too
		let nextday = new Date(date.getTime() + 24 * 60 * 60 * 1000);
		runDate(nextday);
	}
	else {
		//did not grab this date yet
		let curtime = Date.now();
		if(date.getTime() - curtime < 24 * 60 * 60 * 1000) {
			//if the date we are trying to fetch is tomorrow, keep trying
			let goaltime = Math.ceil(curtime / (30 * 60 * 1000)) * (30 * 60 * 1000); //next xx:30
			//let goaltime = Math.ceil(curtime / (10 * 1000)) * (10 * 1000); //10 secs for test
			//console.log(curtime, goaltime);
			let timer = goaltime - Date.now();
			let goalstring = new Date(goaltime).toISOString();
			console.log("set next run for "+goalstring+" -- "+((goaltime - curtime) / 1000)+" secs remaining");
			setTimeout(() => {
				runDate(date);
			}, timer);
		}
		else {
			//if the date we are trying to fetch is further in the future, wait until tomorrow afternoon to try again
			//UNLESS it is (assumed) the weekend and we need sat/sun/mon - then we keep trying
			if([6, 0, 1].includes(date.getDay())) {
				let goaltime = Math.ceil(curtime / (30 * 60 * 1000)) * (30 * 60 * 1000); //next xx:30
			}
			else {
				let goaltime = Math.ceil(curtime / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000) - (tzval * 60 * 60 * 1000); //tomorrow 12:00 (in local time zone)
			}
			let goaltime = Math.ceil(curtime / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000) - (tzval * 60 * 60 * 1000); //tomorrow 12:00 (in local time zone)
			let timer = goaltime - Date.now();
			let goalstring = new Date(goaltime).toISOString();
			console.log("set next run for "+goalstring+" -- "+((goaltime - curtime) / 1000)+" secs remaining");
			setTimeout(() => {
				runDate(date);
			}, timer);
		}
	}
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
