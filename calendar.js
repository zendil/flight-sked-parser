module.exports = addEvent

const {google} = require("googleapis");

const SCOPES = [
	"https://www.googleapis.com/auth/calendar.events",
	"https://www.googleapis.com/auth/calendar.calendarlist.readonly",
	"https://www.googleapis.com/auth/calendar.calendars.readonly",
];
const CREDENTIALS_PATH = process.env.NODE_CREDENTIALS_PATH || "credentials.json";

async function authorize() {
	client = await new google.auth.GoogleAuth({
		keyFile: CREDENTIALS_PATH,
		scopes: SCOPES,
	}).getClient();
	client.getAccessToken().then((token) => {
		
	}).catch((err) => {
		console.log("err...", err)
	});
	return client;
}

async function listEvents(auth) {
	const calendar = google.calendar({version: 'v3', auth});
	const res = await calendar.events.list({
		calendarId: 'peterson.ted.f@gmail.com',
		timeMin: new Date().toISOString(),
		maxResults: 10,
		singleEvents: true,
		orderBy: 'startTime',
	});
	const events = res.data.items;
	if (!events || events.length === 0) {
		console.log('No upcoming events found.');
		return;
	}
	console.log('Upcoming 10 events:');
	events.map((event, i) => {
	const start = event.start.dateTime || event.start.date;
		console.log(`${start} - ${event.summary}`);
	});
}

async function addEvent(auth, info) {
	if(info.summary === undefined || info.summary === "") info.summary = "Unknown Event";
	//console.log(info.start instanceof Date);
	//console.log("start: "+info.start.toISOString());
	if(!auth) auth = await authorize();
	const calendar = google.calendar({version: 'v3', auth});
	let exists = await checkEventExists(auth, {summary: info.summary, start: info.start});
	if(exists) {
		console.log("event already exists, skipping");
	}
	else {
		const create = await calendar.events.insert({
			calendarId: "peterson.ted.f@gmail.com",
			requestBody: {
				start: {
					dateTime: info.start.toISOString(),
					timeZone: "America/Chicago",
				},
				end: {
					dateTime: info.end.toISOString(),
					timeZone: "America/Chicago",
				},
				summary: info.summary,
				location: info.location,
				description: info.description,
			}
		});
		console.log("created event");
	}
}

async function checkEventExists(auth, search) {
	//console.log("search summary: "+search.summary);
	let found = false;
	const calendar = google.calendar({version: 'v3', auth});
	const res = await calendar.events.list({
		calendarId: 'peterson.ted.f@gmail.com',
		timeMin: search.start.toISOString(),
		timeMax: new Date(search.start.getTime() + 1 * 60000).toISOString(),
		maxResults: 100,
		singleEvents: true,
		orderBy: 'startTime',
	});
	const list = res.data.items;
	list.some((event) => {
		//console.log(event.summary);
		if(event.summary && event.summary.toLowerCase() == search.summary.toLowerCase()) {
			const caldate = new Date(event.start.dateTime);
			if(caldate.getTime() == search.start.getTime()) {
				console.log("found event "+event.summary+" "+event.start.dateTime);
				found = true;
				return true;
			}
		}
	});
	if(found) return true;
	else {
		console.log("not found event");
		return false;
	}
}

// authorize().then((auth) => {
	// //listEvents(auth);
	// //addEvent(auth);
	// //checkEventExists(auth, {summary: "Test Event 2", start: new Date("2025-07-20T18:00:00")});
// }).catch(console.error);