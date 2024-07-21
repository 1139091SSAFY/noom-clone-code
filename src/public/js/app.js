// const messageList = document.querySelector('ul');
// const nickForm = document.querySelector('#nick');
// const messageForm = document.querySelector('#message');

// function makeMessage(type, payload) {
//   const msg = { type, payload };
//   return JSON.stringify(msg);
// }

// // 브라우저에서는 backend와 connection을 열어 주고 있음
// const socket = new WebSocket(`ws://${window.location.host}`);
// // const socket = new WebSocket("http://localhost:3000");

// // event listener에 연결
// socket.addEventListener("open", () => {
//   console.log("Connected to Server ✅");
// });

// socket.addEventListener("message", (message) => {
//   // console.log("New message:", message.data, "from the Server");
//   const li = document.createElement('li');
//   li.innerText = message.data;
//   messageList.append(li);
// });

// socket.addEventListener("close", () => {
//   console.log("Disconnected from Server ❌");
// });

// // setTimeout(() => {
// //   // ☆☆☆front-end가 back-end로 무언가를 보낼 수 있음☆☆☆
// //   socket.send("hello from the browser!");
// // }, 10000);

// function handleSubmit(event) {
//   event.preventDefault();
//   const input = messageForm.querySelector('input');
//   socket.send(makeMessage("new_message", input.value));
//   input.value = '';
// }

// function handleNickSubmit(event) {
//   event.preventDefault();
//   const input = nickForm.querySelector('input');

//   // 1.
//   // socket.send(input.value.toString());

//   // 2.
//   // socket.send({
//   //   type: "nickname",
//   //   payload: input.value,
//   // });

//   // 3.
//   socket.send(makeMessage("nickname", input.value));

//   input.value = '';
// }
// messageForm.addEventListener('submit', handleSubmit);
// nickForm.addEventListener('submit', handleNickSubmit);

// ###########################################################

const socket = io();

const welcome = document.getElementById("welcome");
const form = document.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = document.querySelector("input");

  function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    input.value = "";

    // 메시지를 보내는 방이 어떤 방인지 알아야 하기 때문에, roomName을 같이 보냄
    socket.emit("new_message", value, roomName, () => {
      addMessage(`You: ${value}`);
    });
  }

  function handleNicknameSubmit(event) {
    event.preventDefault();

    const input = room.querySelector("#name input");
    const value = input.value;

    socket.emit("nickname", value);
  }

  function showRoom() {
    welcome.hidden = true;
    room.hidden = false;

    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;

    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name")
    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNicknameSubmit);
  }

  // room이라는 event를 emit함
  // emit(event 이름, 보내고 싶은 payload, 서버에서 호출하는 function(function은 front-end에 존재))
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = ""
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} arrived!`);
})

socket.on("bye", (left, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${left} Left`);
})

// socket.on("new_message", addMessage);
socket.on("new_message", (msg) => addMessage(msg));


// 방 목록
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }

  rooms.forEach(room => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  })
});