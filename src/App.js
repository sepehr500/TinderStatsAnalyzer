// import data from "../data.json";
import React, { useCallback, useState } from "react";
import { Bar } from "react-chartjs-2";
import { sum, take } from "ramda";
import Tippy from "@tippy.js/react";
import { useDropzone } from "react-dropzone";
import "tippy.js/dist/tippy.css";

const dayOfWeekMap = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday"
};

const barRed = "#f56565";

const numberWithCommas = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const groupExactValues = (arr, key = "t") => {
  return Object.entries(
    arr.reduce((prev, curr) => {
      if (prev[curr[key]]) {
        return Object.assign(prev, { [curr[key]]: prev[curr[key]] + curr.y });
      }
      return Object.assign(prev, { [curr[key]]: curr.y });
    }, {})
  ).map(([k, v]) => {
    return {
      [key]: k,
      y: v
    };
  });
};

const Card = ({ title, body, description }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white mb-10 mx-auto">
      <div className="px-2 py-4">
        <Tippy enabled={!!description} content={description || ""}>
          <div
            style={{
              borderBottomWidth: "1.2px"
            }}
            className="font-bold text-xl mb-2 text-center border-solid border-b-3 border-red-400 pb-2"
          >
            {title}
          </div>
        </Tippy>
        <p className="text-gray-700 text-base text-center my-10 text-4xl text-red-500">
          {typeof body === "number" && numberWithCommas(body)}
          {typeof body !== "number" && body}
        </p>
      </div>
    </div>
  );
};

const App = () => {
  const [data, setData] = useState(null);
  const onDrop = useCallback(acceptedFiles => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        // Do whatever you want with the file contents
        const text = reader.result;
        setData(JSON.parse(text));
      };
      reader.readAsText(file);
    });
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  if (!data) {
    return (
      <div className="h-screen flex items-center">
        <div className="bg-white max-w-sm mb-10 mx-auto p-3 rounded shadow-lg text-4xl text-center text-red-600">
          <h1>Tinder Stats Download instructions</h1>
          <h3 className="text-2xl my-2">
            This application will give you useful stats on your Tinder usage
            history
          </h3>
          <ol className="text-black text-xl">
            <li>
              1. Request you data by clicking{" "}
              <a
                target="_blank"
                rel="noopener"
                href="https://account.gotinder.com/data"
                className="underline"
              >
                here
              </a>
            </li>
            <li>2. Unzip the file Tinder sends you and drag data below </li>
            <li>
              Note: Your data will <strong>NOT</strong> be sent anywhere and
              will stay on your computer.
            </li>
          </ol>
          <div
            className="text-xl border-t border-black pt-2"
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some files here, or click to select files</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  const convertObjectToList = (object, groupByString) => {
    return Object.entries(object).map(([k, v]) => {
      if (groupByString === "dayOfWeek") {
        return {
          x: dayOfWeekMap[new Date(k).getDay()],
          y: v
        };
      }
      // take 7 makes this grouped by month
      return {
        t: take(7, k),
        y: v
      };
    });
  };

  const sumValues = obj => sum(obj.map(i => i.y));

  const opensByDay = convertObjectToList(data.Usage.app_opens);
  const rightSwipesByDay = convertObjectToList(data.Usage.swipes_likes);
  const leftSwipesByDay = convertObjectToList(data.Usage.swipes_passes);
  const matchesByDay = convertObjectToList(data.Usage.matches);
  const mesagesSentByDay = convertObjectToList(data.Usage.messages_sent);
  const mesagesReceivedByDay = convertObjectToList(
    data.Usage.messages_received
  );
  const percentToFixed = num => `${(num * 100).toFixed()}%`;

  // Total matches
  const totalMatches = sumValues(matchesByDay);

  // Total right swipes
  const totalRightSwipes = sumValues(rightSwipesByDay);

  // Match rate
  const matchesPerRight = percentToFixed(totalMatches / totalRightSwipes);

  // Total left swipes
  const totalLeftSwipes = sumValues(leftSwipesByDay);

  // Total messages sent
  const totalMessagesSent = sumValues(mesagesSentByDay);

  // Total messages received
  const totalMessagesReceived = sumValues(mesagesReceivedByDay);

  // Response rate
  const responseRate = percentToFixed(
    totalMessagesReceived / totalMessagesSent
  );

  const rightSwipesByDayOfWeek = groupExactValues(
    convertObjectToList(data.Usage.swipes_likes, "dayOfWeek"),
    "x"
  );

  const leftSwipesByDayOfWeek = groupExactValues(
    convertObjectToList(data.Usage.swipes_passes, "dayOfWeek"),
    "x"
  );

  const totalSwipesByDayOfWeek = rightSwipesByDayOfWeek.map((day, index) => {
    return {
      x: day.x,
      y: day.y + leftSwipesByDayOfWeek.find(d => d.x === day.x).y
    };
  });

  const matchesByDayOfWeek = groupExactValues(
    convertObjectToList(data.Usage.matches, "dayOfWeek"),
    "x"
  );

  return (
    <div className="flex-col justify-center pt-8 container mx-auto pb-1">
      <h1 className="bg-white max-w-sm mb-10 mx-auto py-3 rounded shadow-lg text-4xl text-center text-red-600">
        Your Tinder Stats
      </h1>
      <Card title="Total Matches" body={totalMatches} />
      <Card
        description="Number of messages that resulted in a response"
        title="Response Rate"
        body={responseRate}
      />
      <Card
        title="Match Rate"
        description="Number of right swipes that resulted in matches"
        body={matchesPerRight}
      />
      <Card title="Total Right Swipes" body={totalRightSwipes} />
      <Card title="Total Left Swipes" body={totalLeftSwipes} />
      <Card
        title="Matches by month"
        body={
          <Bar
            data={{
              datasets: [
                {
                  backgroundColor: barRed,
                  label: "# of Matches",
                  data: groupExactValues(matchesByDay)
                }
              ]
            }}
            options={{
              scales: {
                xAxes: [
                  {
                    type: "time",
                    time: {
                      unit: "month"
                    }
                  }
                ]
              }
            }}
          />
        }
      />
      <Card
        title="Activity by Day Of Week"
        body={
          <Bar
            data={{
              labels: Object.values(dayOfWeekMap),
              datasets: [
                {
                  backgroundColor: barRed,
                  label: "Swipes",
                  data: totalSwipesByDayOfWeek.map(i => i.y)
                }
              ]
            }}
          />
        }
      />
      <Card
        title="Matches by Day of Week"
        body={
          <Bar
            data={{
              labels: Object.values(dayOfWeekMap),
              datasets: [
                {
                  backgroundColor: barRed,
                  label: "Matches",
                  data: matchesByDayOfWeek.map(i => i.y)
                }
              ]
            }}
          />
        }
      />

      <Card
        title="App Opens by Month"
        description="Number of times the app is opened every month"
        body={
          <Bar
            data={{
              datasets: [
                {
                  backgroundColor: barRed,
                  label: "# of app opens by month",
                  data: groupExactValues(opensByDay)
                }
              ]
            }}
            options={{
              scales: {
                xAxes: [
                  {
                    type: "time",
                    time: {
                      unit: "month"
                    }
                  }
                ]
              }
            }}
          />
        }
      />
    </div>
  );
};

export default App;
