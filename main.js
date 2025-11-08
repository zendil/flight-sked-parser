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
while(firstday.getDay() == 0 || firstday.getDay() == 6) {
	//Sun and Sat
	firstday = new Date(firstday.valueOf() + 24 * 60 * 60 * 1000);
}
let firstdate = firstday.getFullYear().toString().padStart(2, "0")+"-"+(firstday.getMonth()+1).toString().padStart(2, "0")+"-"+(firstday.getDate()+0).toString().padStart(2, "0");
//firstdate = "2025-08-14";

runDate(firstdate);

function setNextRun() {
	let curtime = Date.now();
	let goaltime = Math.ceil(curtime / (30 * 60 * 1000)) * (30 * 60 * 1000);
	//let goaltime = Math.ceil(curtime / (10 * 1000)) * (10 * 1000); //10 secs for test
	//console.log(curtime, goaltime);
	let nextday = new Date(curtime + 24 * 60 * 60 * 1000);
	while(nextday.getDay() == 0 || nextday.getDay() == 6) {
		//Sun and Sat
		nextday = new Date(nextday.valueOf() + 24 * 60 * 60 * 1000);
	}
	let formatednext = nextday.getFullYear().toString().padStart(2, "0")+"-"+(nextday.getMonth()+1).toString().padStart(2, "0")+"-"+(nextday.getDate()+0).toString().padStart(2, "0");
	//console.log(formatednext);
	//console.log(fetched);
	if(fetched[formatednext] === true) {
		//already got this day
		console.log("date "+formatednext+" already fetched");
		goaltime = Math.ceil(curtime / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000) - (tzval * 60 * 60 * 1000);
	}
	let timer = goaltime - Date.now();
	let goalstring = new Date(goaltime).toISOString();
	console.log("set next run for "+goalstring+" -- "+((goaltime - curtime) / 1000)+" secs remaining");
	setTimeout(() => {
		runDate(formatednext);
	}, timer);
}



// fs.readFile("test1.pdf", (err, data) => {
	// console.log(data);
	// parseFile(data);
// });

// return false;

async function runDate(date) {
	console.log("fetching date "+date);
	fetchSked(date).then((pdfBuffer) => {
		parseFile(pdfBuffer).then((sked) => {
			//console.log(sked.flights.list);
			sked.flights.list.forEach((event) => {
				let details = {};
				if(event.instructor && event.instructor.indexOf(name) !== -1) {
					details = {
						summary: event.event.join(", "),
						start: new Date(date+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(date+"T"+event.land.substr(0,2)+":"+event.land.substr(2,2)+":00"+tz),
						description: event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student[0] && event.student[0].indexOf(name) !== -1) {
					details = {
						summary: event.event[0],
						start: new Date(date+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(date+"T"+event.land.substr(0,2)+":"+event.land.substr(2,2)+":00"+tz),
						description: "IP "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student[1] && event.student[1].indexOf(name) !== -1) {
					details = {
						summary: event.event[1],
						start: new Date(date+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(date+"T"+event.land.substr(0,2)+":"+event.land.substr(2,2)+":00"+tz),
						description: "IP "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student[2] && event.student[2].indexOf(name) !== -1) {
					details = {
						summary: event.event[2],
						start: new Date(date+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(date+"T"+event.land.substr(0,2)+":"+event.land.substr(2,2)+":00"+tz),
						description: "IP "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
			});
			
			//console.log(sked.sims.list);
			sked.sims.list.forEach((event) => {
				if(event.device.substr(0, 3) == "PTT") event.notes = "PTT\n"+event.notes;
				if(!event.instructor) event.instructor = "TBD";
				if(!event.notes) event.notes = "";
				if(event.brief == "TBD") event.brief = event.takeoff;
				let details = {};
				if(event.instructor && event.instructor.indexOf(name) !== -1) {
					details = {
						summary: event.event.join(", "),
						start: new Date(date+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(new Date(date+"T"+event.takeoff.substr(0,2)+":"+event.takeoff.substr(2,2)+":00"+tz).getTime() + event.duration * 60 * 60 * 1000),
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
						start: new Date(date+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(new Date(date+"T"+event.takeoff.substr(0,2)+":"+event.takeoff.substr(2,2)+":00"+tz).getTime() + event.duration * 60 * 60 * 1000),
						description: "IP "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
				else if(event.student[1] && event.student[1].indexOf(name) !== -1) {
					details = {
						summary: event.event[1],
						start: new Date(date+"T"+event.brief.substr(0,2)+":"+event.brief.substr(2,2)+":00"+tz),
						end: new Date(new Date(date+"T"+event.takeoff.substr(0,2)+":"+event.takeoff.substr(2,2)+":00"+tz).getTime() + event.duration * 60 * 60 * 1000),
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
						start: new Date(date+"T"+event.time.substr(0,2)+":"+event.time.substr(2,2)+":00"+tz),
						end: new Date(date+"T"+event.time.substr(4,2)+":"+event.time.substr(6,2)+":00"+tz),
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
						start: new Date(date+"T"+event.time.substr(0,2)+":"+event.time.substr(2,2)+":00"+tz),
						end: new Date(date+"T"+event.time.substr(5,2)+":"+event.time.substr(7,2)+":00"+tz),
						description: "Instructor "+event.instructor+"\n"+event.notes,
					};
					console.log("add event:");
					console.log(details);
					addEvent(auth, details);
				}
			});
			fetched[date] = true;
			//console.log("fetched "+date+" true");
			setNextRun();
		});
	}).catch((e) => {
		fetched[date] = false;
		//console.log("fetched "+date+" false");
		console.log("ERROR: "+e);
		setNextRun();
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
