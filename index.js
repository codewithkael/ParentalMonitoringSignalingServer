const http = require("http")
const socket = require("websocket").server
const server = http.createServer(() => {
})

server.listen(3000, () => {

})

const users = []
const Types = {
    WrongJsonType: "WrongJsonType",
    SignIn: "SignIn",
    SingInSuccess: "SingInSuccess",
    UserExists: "UserExists",
    StartWatching: "StartWatching",
    FailedToFindUser: "FailedToFindUser",
    UserFoundSuccessfully: "UserFoundSuccessfully",
    WrongPassword:"WrongPassword",
    Offer: "Offer",
    Answer: "Answer",
    IceCandidate: "IceCandidate",
    SwitchCamera: "SwitchCamera",
    EndCall: "EndCall",
    StartLocating:"StartLocating",
    Location:"Location"
}


const webSocket = new socket({httpServer: server})


webSocket.on('request', (req) => {
    const connection = req.accept();

    connection.on('message', (message) => {
        console.log(message)
        try {
            const data = JSON.parse(message.utf8Data);
            const currentUser = findUser(data.username)
            const userToReceive = findUser(data.target)
            console.log(data)

            switch (data.type) {
                case Types.SignIn:
                    if (currentUser) {
                        sendToConnection(connection, {type: Types.UserExists})
                        return
                    }

                    users.push({username: data.username, conn: connection,password:data.data})
                    sendToConnection(connection, {type: Types.SingInSuccess})
                    break

                case Types.StartWatching :
                    if (userToReceive) {
                        if (data.data === userToReceive.password){
                            sendToConnection(connection, {type: Types.UserFoundSuccessfully})
                            sendToConnection(userToReceive.conn, {
                                type: Types.StartWatching, username: currentUser.username, target: userToReceive.username
                            })
                        }else {
                            sendToConnection(connection, {type: Types.WrongPassword})
                        }

                    } else {
                        sendToConnection(connection, {type: Types.FailedToFindUser})
                    }

                    break

                case Types.StartLocating:
                    if (userToReceive){
                        if (data.data === userToReceive.password){
                            sendToConnection(connection, {type: Types.UserFoundSuccessfully})
                            sendToConnection(userToReceive.conn, {
                                type: Types.StartLocating, username: currentUser.username, target: userToReceive.username
                            })
                        }else {
                            sendToConnection(connection, {type: Types.WrongPassword})
                        }
                    }else {
                        sendToConnection(connection, {type: Types.FailedToFindUser})
                    }
                    break



                case Types.Offer :
                    if (userToReceive) {
                        sendToConnection(userToReceive.conn, {
                            type: Types.Offer, username: data.username, data: data.data
                        })
                    } else {
                        sendToConnection(connection, {type: Types.FailedToFindUser})
                    }
                    break

                case Types.Answer :
                    if (userToReceive) {
                        sendToConnection(userToReceive.conn, {
                            type: Types.Answer, username: data.username, data: data.data
                        })
                    } else {
                        sendToConnection(connection, {type: Types.FailedToFindUser})
                    }
                    break

                case Types.IceCandidate:
                    if (userToReceive) {
                        sendToConnection(userToReceive.conn, {
                            type: Types.IceCandidate, username: data.username, data: {
                                sdpMLineIndex: data.data.sdpMLineIndex,
                                sdpMid: data.data.sdpMid,
                                sdpCandidate: data.data.sdpCandidate
                            }
                        })
                    }
                    break

                case Types.SwitchCamera:
                    if (userToReceive) {
                        sendToConnection(userToReceive.conn, {
                            type: Types.SwitchCamera, username: data.username
                        })
                    }
                    break
                case Types.EndCall:
                    if (userToReceive) {
                        sendToConnection(userToReceive.conn, {
                            type: Types.EndCall, username: data.username
                        })
                    }
                    break

                case Types.Location :
                    if (userToReceive){
                        sendToConnection(userToReceive.conn,{
                            type:Types.Location, username:data.username,data:data.data
                        })
                    }
                    break
            }
        } catch (e) {
            console.log(e.message)
            sendToConnection(connection, {type: Types.WrongJsonType})
        }

    });


    connection.on('close', () => {
        console.log('closed ', connection)
        users.forEach(user => {
            if (user.conn === connection) {
                users.splice(users.indexOf(user), 1)
            }
        })
    })
});


const sendToConnection = (connection, message) => {
    connection.send(JSON.stringify(message))
}

const findUser = username => {
    for (let i = 0; i < users.length; i++) {
        if (users[i].username === username) return users[i]
    }
}
