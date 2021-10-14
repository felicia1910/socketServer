// 如果不需要用 https 的話，要改成引用 http 喔
var http = require('http');
var socketio = require('socket.io');
//這邊要注意fetch版本太高會有問題
const fetch = require('node-fetch');
//cors相關
var express = require('express');
var cors = require('cors');
var app = express();
app.use(cors());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", " * ");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

var port = process.env.PORT || 4010;

var server = http.createServer(app);
server.listen(port, function () {
    console.log('API listening on *:' + port);
})
//>V3後會有cors的問題
var io = socketio(server, {
    cors: {
        origin: '*',
    }
});

//用 socket 方式取得
io.on('connection', function (socket) {
    console.log('user connected')
    socket.emit("allMessage", dataVeiw);
    socket.emit("allDrop", allDrop);

    socket.on("sendMessage", function (mes) {
        console.log('傳過來的訊息', mes);
        if (mes.which == 1) {
            //客人傳來的
            if (mes.user) {
                //先判定有沒有該客人的資料
                let findCus = dataVeiw.chat[0].customer.map(e => { return e.userId }).indexOf(mes.userId);
                //推進去的聊天內容
                let pushChat = (mess, isUser) => {
                    return {
                        id: mess.textId,
                        type: mess.type,
                        mes: mess.message,
                        //這邊先將stratTime都攔截下來看是否尾端有Z(有Z會被轉時區，需要先刪除Z) 
                        time: new Date(mess.timestamp + 8 * 3600 * 1000),
                        isUser: isUser
                    }
                }

                //有客人的話
                if (findCus !== -1) {
                    console.log('findCus', findCus)
                    console.log('?', dataVeiw.chat[0].customer[findCus])
                    dataVeiw.chat[0].customer[findCus].name = mes.name;
                    dataVeiw.chat[0].customer[findCus].picUrl = mes.pic;
                    dataVeiw.chat[0].customer[findCus].statusText = mes.st;
                    dataVeiw.chat[0].customer[findCus].over = 0;//有新留言要讓他成為非結案(非結案:0，處理中:1,結案:2)
                    dataVeiw.chat[0].customer[findCus].chating.push(pushChat(mes, true));
                    io.emit("newMessage", {
                        isNew: false,
                        mes: pushChat(mes, true),
                        data: dataVeiw.chat[0].customer[findCus]
                    });
                }

                //沒有該客人
                else {
                    let newCus = {
                        name: mes.name,
                        tagName: '',//給使用者標記的名字
                        picUrl: mes.pic,
                        statusText: mes.st,
                        userId: mes.userId,
                        whatName: 'Line',
                        over: 0,
                        who: '',//哪個人員在處理
                        block:false,//該客人是否被黑單
                        id: 1,
                        chating: [pushChat(mes, true)]
                    }
                    dataVeiw.chat[0].customer.push(newCus)
                    io.emit("newMessage", {
                        isNew: true,
                        mes: newCus
                    });
                }
            }
            //使用者回傳給客人的
            else {
                callToLine(mes.user);//告訴line
            }


        }
        //messages.push(message);
    })

})

const callToLine = (req) => {
    //let url = 'http://localhost:4010/pushMes';
    let url = 'https://socketio-server-testing.herokuapp.com/pushMes';
    fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: req.id,
            mes: req.message
        })
    }).then((response) => {
        return response.json();
    }).then((jsonData) => {
        console.log('jsonData', jsonData)
    })
}

//在這邊先構思資料庫的結構
const idVeiw = [
    { name: 'line', id: 1 },
    { name: 'Facebook', id: 2 },
    { name: '客製化聊天室', id: 3 },
]

const status = [
    { name: '待處理', id: 0 },
    { name: '處理中', id: 1 },
    { name: '已結束', id: 2 }
]

const allDrop = {
    chat: idVeiw,
    status: status
}

let dataVeiw = {
    chat: [
        {
            name: 'Line',
            id: 1,
            customer: [
                {   
                    name: '客人A',
                    tagName: '毛很多的客人',//給使用者標記的名字
                    picUrl: 'https://google.com',
                    statusText: '這是測試客人的狀態',
                    userId: '321',//U2f246c610be7fe3e6e86cdaeda6c8963
                    whatName: 'Line',
                    over: 0,
                    who: '老王',//哪個人員在處理
                    block:false,//該客人是否被黑單
                    id: 1,
                    chating: [
                        { id: 1, type: 'text', mes: '你好!!!!!', time: '2021-10-09T10:00:00Z', isUser: true },
                        { id: 2, type: 'text', mes: '想請問一下', time: '2021-10-07T10:10:00Z', isUser: true },
                        { id: 3, type: 'text', mes: '不給問喔', time: '2021-10-07T11:00:00Z', isUser: false },
                    ]
                },
                {
                    name: '客人B',
                    tagName: '朋友A',//給使用者標記的名字
                    picUrl: 'https://google.com',
                    statusText: '這是測試客人的狀態',
                    userId: '732',//U51d16c833b201e6ce6173fdb76284bb8
                    whatName: 'Line',
                    over: 0,
                    who: '老王',//哪個人員在處理
                    block:false,//該客人是否被黑單
                    chating: [
                        { id: 1, type: 'text', mes: '你好', time: '2021-10-05T10:00:00Z', isUser: true },
                        { id: 2, type: 'text', mes: '想請問一下', time: '2021-10-07T10:10:00Z', isUser: true },
                        { id: 3, type: 'text', mes: '不給問喔', time: '2021-10-07T11:00:00Z', isUser: false },
                    ]
                },
                {
                    name: '客人C',
                    tagName: '朋友B',//給使用者標記的名字
                    picUrl: 'https://google.com',
                    statusText: '這是測試客人的狀態',
                    userId: 'U8e6418328c28ac0aa4b07a630e7f2eea',
                    whatName: 'Line',
                    over: 1,
                    who: '老王',//哪個人員在處理
                    block:false,//該客人是否被黑單
                    chating: [
                        { id: 1, type: 'text', mes: '你好', time: '2021-10-06T10:00:00Z', isUser: true },
                        { id: 2, type: 'text', mes: '想請問一下', time: '2021-10-07T10:10:00Z', isUser: true },
                        { id: 3, type: 'text', mes: '不給問喔', time: '2021-10-07T11:00:00Z', isUser: false },
                    ]
                },
            ]
        },
        {
            name: 'Facebook',
            id: 2,
            customer: [
                {
                    name: '客人FB',
                    tagName: '毛很多的客人',//給使用者標記的名字
                    picUrl: 'https://google.com',
                    statusText: '這是測試客人的狀態',
                    userId: '33',
                    whatName: 'Line',
                    over: 2,
                    who: '老王',//哪個人員在處理
                    block:false,//該客人是否被黑單
                    chating: [
                        { id: 1, type: 'text', mes: '你好', time: '2021-10-07T10:00:00', isUser: true },
                        { id: 2, type: 'text', mes: '想請問一下', time: '2021-10-07T10:10:00', isUser: true },
                        { id: 3, type: 'text', mes: '不給問喔', time: '2021-10-07T11:00:00', isUser: false },
                    ]
                }
            ]
        },
        {
            name: '客製化聊天室',
            id: 3,
            customer: [
                {
                    name: '路邊的客人',
                    tagName: '手機很多的客人',//給使用者標記的名字
                    picUrl: 'https://google.com',
                    statusText: '這是測試客人的狀態',
                    userId: '6321',
                    whatName: 'Line',
                    over: 2,
                    who: '老陳',//哪個人員在處理
                    block:true,//該客人是否被黑單
                    chating: [
                        { id: 1, type: 'text', mes: '你好阿', time: '2021-10-04T10:00:00', isUser: true },
                        { id: 2, type: 'text', mes: '想請問一下', time: '2021-10-07T10:10:00', isUser: true },
                        { id: 3, type: 'text', mes: '不給問喔', time: '2021-10-07T11:00:00', isUser: false },
                    ]
                }
            ]
        }
    ]
}

