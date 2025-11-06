const http = require("http");

const data = JSON.stringify({
  projectId: 1,
  question: "What is the main topic of the documents?",
});

const options = {
  hostname: "localhost",
  port: 3001,
  path: "/chat/query",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

console.log("Testing chat API...");

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    console.log("RESPONSE BODY:");
    console.log(responseData);

    if (res.statusCode === 200) {
      console.log("✅ API test successful!");
    } else {
      console.log("❌ API test failed!");
    }
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
