var app = require('express')();
//var http = require('http').createServer(app);
var server = app.listen(3000, function(){
  console.log('Funcando en 3000');
});
var io = require('socket.io').listen(server);
var mysql = require("mysql");
var md5 = require('md5');


function handleDisconnect() {
  con = mysql.createConnection({
      host: "127.0.0.1",
      //user: "skual",
      user: "root",
      //password: "enikma",
      password: "",
      database: "chatsupport",
      insecureAuth: true,
      charset: 'latin1_swedish_ci'
  });

  con.connect(function(err) {
      if (err) {
          console.log('Error en la conexion de la base:', err);
          setTimeout(handleDisconnect, 2000);
      }
  });

  con.on('error', function(err) {
      console.log('Error db:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          handleDisconnect();
      } else {
          throw err;
      }
  });
}

handleDisconnect();


io.on('connection', function(socket){
    console.log('Se conecto un pibe');
    
    socket.on('crear-chat', function(nombre, callback){
        crearChat(nombre, socket, function(resp){
            callback(resp);
            socket.join('chat'+resp.chat);
            io.emit('nueva-persona', resp);
        });
    });

    socket.on('mensaje-persona', function(data, callback){
        crearMensaje(data, 1, function(resp){
            if(resp[0]){
                io.to('chat'+data.chatId).emit('msj-nuevo-persona', resp[2]);
            }
            callback(resp);
        });
    });

    socket.on('admin-escribiendo', function(data){
        io.to('chat'+data.chatId).emit('adm-escr');
    });

    socket.on('mensaje-admin', function(data, callback){
        crearMensaje(data, 2, function(resp){
            if(resp[0]){
                io.to('chat'+data.chatId).emit('msj-nuevo-admin', resp[2]);
            }
            callback(resp);
        });
    });

    socket.on('atender-persona', function(data, callback){
        atenderPersona(data, function(resp){
            if(resp){
                socket.join('chat'+data.chatId);
                io.to('chat'+data.chatId).emit('admin-atendio', {pksoporte: data.pkadmin, imagen: 'img.jpg', nombre: "Juan Almada" });
            }
            callback(resp);
        });
    });
   
    socket.on('disconnect', function() {
        console.log('se desconecto un pibe');
    });

    
});

function crearChat(nombre, socket, callback) {
    con.query("INSERT INTO chat (persona, socketid, fkestado) VALUES (?, ?, ?)", [nombre, socket.id, 1], function(err, rows) {
        if (!err) {
            callback({chat: rows.insertId, persona: nombre, socket: socket.id});
        } else {
            console.log(err);
        }
    });
};
function crearMensaje(data, tpersona, callback) {
    con.query("INSERT INTO mensajes (fkpersona, mensaje, fkchat) VALUES (?, ?, ?)", [tpersona, data.mensaje, data.chatId], function(err, rows) {
        if (!err) {
            callback([true, data.nroMsj, data.mensaje]);
        } else {
            callback([false, data.nroMsj]);
            console.log(err);
        }
    });
};
function atenderPersona(data, callback) {
    con.query("UPDATE chat SET pksoporte = ?, fkestado = ? WHERE pkchat = ? ", [data.pkadmin, 2, data.chatId], function(err, rows) {
        if (!err) {
            callback(true);
        } else {
            callback(false);
            console.log(err);
        }
    });
};