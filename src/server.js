// import http from "http";
// import WebSocket from "ws";
import express from "express";

// app : Express.js와 같은 웹 프레임워크를 통해 정의된 요청 핸들러
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// // HTTP 서버 생성
// // 생성된 서버 객체는 HTTP 요청을 처리할 준비가 됨
// const server = http.createServer(app);

// // WebSocket 서버 생성
// // `server` 객체를 인자로 전달해, 동일한 HTTP 서버에서 WebSocket 연결을 처리할 수 있도록 설정함
// // 이를 통해 하나의 서버에서 HTTP 요청과 WebSocket 연결을 모두 처리할 수 있음
// const wss = new WebSocket.Server({ server });

// // HTTP 서버와 WebSocket 서버를 통합해,
// // 클라이언트가 HTTP 요청을 통해 서버와 통신할 수 있을 뿐만 아니라, WebSocket을 통해 실시간 양방향 통신도 가능하게 함

// // fake db
// // 누군가 우리 서버에 연결하면, 그 connection을 담는 부분
// // socket에 nickname 달 수 있음
// const sockets = [];

// // `connection` 이후 event를 listen하는 부분
// // 전체 서버를 위한 코드 wss
// wss.on("connection", (socket) => {
//   // backend와 연결한 각 브라우저(각 socket)를 위한 event listener
//   sockets.push(socket);
//   socket["nickname"] = "Anonymous";

//   // console.log(socket);
//   console.log("Connected to Browser");
//   socket.on("close", () => console.log("Disconnected from the Browser"));

//   socket.on("message", (msg) => {
//     // console.log(message.toString())

//     const message = JSON.parse(msg.toString());
//     // console.log(msg.toString(), message)

//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
//       case "nickname":
//         // socket은 기본적으로 object이기 때문에 속성을 추가할 수 있음
//         socket["nickname"] = message.payload;
//     }


//   });
//   // ☆☆☆back-end에서 front-end로 무언가를 보낼 수 있음☆☆☆
//   // socket.send("hello");
// });


// ###########################################################

import http from "http";
import SocketIO from "socket.io";

const server = http.createServer(app);
const io = SocketIO(server);

function publicRooms() {
  // const {
  //   sockets: {
  //     adapter: { sids, rooms },
  //   },
  // } = io;

  const sids = io.sockets.adapter.sids;
  const rooms = io.sockets.adapter.rooms;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  })
  return publicRooms;
}

function countRoom(roomName) {
  return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on("connection", (socket) => {
  console.log(socket);
  socket["nickname"] = "Anonymous";

  // WebSocket만 사용 시와 비교해 대비되는 사항들
  // 1. 어떤 event던(custom event 포함) 전송 가능
  // 2. Javascript 객체를 전송 가능
  socket.onAny((event) => {
    console.log(io.sockets.adapter);
    console.log(`Socket Event: ${event}`);
  })

  socket.on("enter_room", (roomName, done) => {
    // room 생성
    socket.join(roomName);

    // done 함수는 front-end에서 실행됨
    done();

    // 메시지를 하나의 socket에만 보냄
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    // 메시지를 모든 socket에 보냄
    io.sockets.emit("room_change", publicRooms());
  });

  // disconnect: 완전히 연결이 끊기는 것, disconnecting: 연결은 끊기지만 방을 나가지는 않는 것
  // disconnecting event는 socket이 방을 떠나기 바로 직전에 발생함
  socket.on("disconnecting", () => {
    // console.log(`User is disconnecting...`, socket.rooms);
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    });
  })

  socket.on("disconnect", () => {
    io.sockets.emit("room_change", publicRooms());
  })

  // room 이름을 같이 수신
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);

    // done 함수는 front-end에서 실행됨
    done();
  })

  socket.on("nickname", (nickname) => socket["nickname"] = nickname);
})

// Node.js 서버를 특정 포트에서 실행하도록 설정하는 구문
// 서버가 3000포트에서 요청을 수신하도록 설정
// handleListen은 서버가 성공적으로 시작되었을 때 호출되는 콜백 함수
server.listen(3000, handleListen);