module.exports = fetchSked;

	const https = require("node:https");
	const fs = require("node:fs");

function fetchSked(date) {
	return new Promise((resolve, reject) => {
		//reject("fail");
		const urlprefix = "https://www.cnatra.navy.mil/scheds/";
		const urlwing = "TW5";
		const urlsquadron = "SQ-HT-8";
		//const filedate = date.getFullYear().toString().padStart(2, "0")+"-"+(date.getMonth()+1).toString().padStart(2, "0")+"-"+(date.getDate()+0).toString().padStart(2, "0");
		const filedate = date;
		const filesquadron = "HT-8";
		const filename = "Frontpage";

		let url = new URL(urlprefix+urlwing+"/"+urlsquadron+"/"+"!"+filedate+"!"+filesquadron+"!"+filename+".pdf");
		//console.log(url);

		const urloptions = {
			hostname: url.host,
			path: url.pathname,
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0"
			}
		};

		let data = Buffer.from([]);

		const urlreq = https.request(urloptions, (res) => {
			res.on("data", (chunk) => {
				if(res.statusCode == 200) {
					data = Buffer.concat([data, chunk]);
				}
				else {
					let e = "Fetch Error ["+res.statusCode+"] - "+res.statusMessage;
					//console.log(e);
					reject(e);
				}
			});
			res.on("end", () => {
				//fs.createWriteStream("test1.pdf", {flags: "w"}).end(data);
				resolve(data);
			});
		});
		urlreq.on("error", (e) => {
			console.error("problem with request: ${e.message}");
			reject(e);
		});

		urlreq.end();
	});
}