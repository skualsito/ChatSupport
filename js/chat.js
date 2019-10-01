(function ( $ ) {
    var rnd = Math.floor(Math.random()*(9-1+1)+1);
    var rnd2 = (rnd + 1) >= 10 ? rnd - 2 : rnd + 1; 
    var msjBienvenida, primerMsj, estadoEscribiendo = false;
    var nombrePersona = 'Usuario';
    var avatarPersona = "user"+rnd;
    var avatarAdmin = " avatar/user"+rnd2+".jpg";
    var nombreAdmin = "Administrador";
    var token = "1-asd";
    var ctoe, socket;
    var nroMsj = 0;
    $.fn.chatSupport = function( options ) {
        
        var settings = $.extend({
            url: "http://localhost:3000",
            colorPrimario: "#284a70",
            colorSecundario: "#453736",
            colorTexto: "#fff",
            bienvenida: "Bienvenido a ChatSupport!",
            msjNombre: "En unos instantes uno de nosotros te atenderá. Podes dejar tu consulta mientras esperas",
            token: token
        }, options );
        
        if(typeof io === "function") {
            socket = io(settings.url);
            socket.on('connect_error', function(err) {
                console.log('Error al conectar con el servidor.');
            });
            if(settings.token != ''){
                return initialize(this, settings);
            }            
        } else {
            return console.log('Error, falta libreria socket.io.');
        }
                
 
    };

    async function initialize(div, settings){
        var res = await verToken(settings.token);
        console.log(res);
        if(res){
            render(div, settings);
        } else {
            console.log('Error en el token');
        }
    }

    function render(div, settings){
        div.html('<style> :root{ --color-primario: '+settings.colorPrimario+'; --color-secundario: '+settings.colorSecundario+'; --color-texto: '+settings.colorTexto+' } </style><div class="chat-todo"> <div class="chat-boton-activar"> <i class="fas fa-headset"></i> </div> <div class="chat-contenedor"> <div class="chat-contenedor-support"> <div class="chat-support-imagen"><img src="'+avatarAdmin+'" alt="'+nombreAdmin+'"></div> <div class="chat-support-nombre">'+nombreAdmin+'</div> <div class="spinner"> <div class="bounce1"></div> <div class="bounce2"></div> <div class="bounce3"></div> </div>  </div> <div class="chat-contenedor-mensajes">  </div> <div class="chat-contenedor-enviar"> <input type="text" name="txtMensaje" placeholder="Mensaje"/> <button><i class="fas fa-paper-plane"></i></button> </div> </div> </div>');
        
        $(document).on('click', '.chat-boton-activar', function () {
            $('.chat-todo').toggleClass('activo');
            $('.chat-contenedor').toggleClass('activo');
            if(!msjBienvenida) {
                admEscribiendo();
                msjBienvenida = true;
                setTimeout(function(){ 
                    $('.chat-contenedor-mensajes').append('<div class="chat-mensaje emisor"> <img src="'+avatarAdmin+'" alt="'+nombreAdmin+'"/> <p>'+settings.bienvenida+' <br> Por favor, ingrese su nombre.</p> </div>'); 
                    admEscribiendo(false);
                }, 1000);
            }
        });
        
        $(document).on('keyup', '.chat-contenedor-enviar input[name="txtMensaje"]', function(e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if(code==13){
                enviarMsj(settings);
            }
        });

        $(document).on('click', '.chat-contenedor-enviar button', function(e) {
                enviarMsj(settings);
        });
        
        socket.on('msj-nuevo-admin', function(data){
            $('.chat-contenedor-mensajes').append('<div class="chat-mensaje emisor"> <img src="'+avatarAdmin+'" alt="'+nombreAdmin+'"/> <p>'+data+'</p> </div>'); 
            admEscribiendo(false);
            $('.chat-contenedor-mensajes').scrollTop($('.chat-contenedor-mensajes')[0].scrollHeight);
        });
        socket.on('adm-escr', function(){
            admEscribiendo();
        });
        socket.on('admin-atendio', function(data){
            avatarAdmin = data.imagen;
            nombreAdmin = data.nombre;
            $('.chat-support-imagen img').attr({"src": avatarAdmin, "alt": nombreAdmin});
            $('.chat-support-nombre').html(nombreAdmin);
            $.each($('.chat-mensaje.emisor'), function (index, value) { 
                 $(this).find('img').attr({"src": avatarAdmin, "alt": nombreAdmin});
            });
        });
        
    }

    function enviarMsj(settings) {
        var msjInput = $('.chat-contenedor-enviar input[name="txtMensaje"]');
        var msjGuardar = msjInput.val();
        if(msjGuardar.length > 0){
            if (!primerMsj) {
                admEscribiendo();
                socket.emit('crear-chat', msjGuardar, settings.token, function(data){
                    $('.chat-contenedor-mensajes').append('<div class="chat-mensaje emisor"> <img src="'+avatarAdmin+'" alt="'+nombreAdmin+'"/> <p>Bienvenido '+data.persona+'! '+settings.msjNombre+'</p> </div>'); 
                    nombrePersona = data.persona;
                    $('.chat-contenedor-mensajes').scrollTop($('.chat-contenedor-mensajes').height());
                    $('.chat-todo').attr({'data-s': data.socket, 'data-id': data.chat});
                    admEscribiendo(false);
                });
                primerMsj = true;
            }
            if($('.chat-todo').attr('data-id') != undefined && $('.chat-todo').attr('data-id') != '') {
                socket.emit('mensaje-persona', {chatId: $('.chat-todo').attr('data-id'), mensaje: msjInput.val(), nroMsj: nroMsj}, function(data){
                    if(data[0]){
                        $('.chat-mensaje.receptor[data-nroMsj="'+data[1]+'"] p').append('<i class="fas fa-check" title="Enviado"></i>');
                    } else {
                        $('.chat-mensaje.receptor[data-nroMsj="'+data[1]+'"] p').append('<i class="fas fa-times" title="Error en enviar mensaje"></i>');
                    }
                });
            }
            $('.chat-contenedor-mensajes').append('<div class="chat-mensaje receptor" data-nroMsj="'+nroMsj+'"> <img src="avatar/'+avatarPersona+'.jpg" alt="'+nombrePersona+'"/> <p>'+msjInput.val()+'</p> </div>'); 
            nroMsj++;
            msjInput.val('');
            $('.chat-contenedor-mensajes').scrollTop($('.chat-contenedor-mensajes')[0].scrollHeight);
        }
    }

    async function verToken(tokenaso){
        return new Promise(resolve => {
            socket.emit('ver-token', {token: tokenaso}, function(res){
                resolve(res);
            });
          });       
    }

    function admEscribiendo(estado = true) {
        if(!estadoEscribiendo) {
            $('.spinner').toggleClass('activo');
            estadoEscribiendo = true;
            ctoe = setTimeout(function(){ 
                $('.spinner').toggleClass('activo');
                estadoEscribiendo = false;
            }, 2500);
        }
        if(!estado) {
            estadoEscribiendo = false;
            $('.spinner').toggleClass('activo');
            clearTimeout(ctoe);
        }
    }
 
}( jQuery ));

/*
<div class="chat-todo">
        <div class="chat-boton-activar">
            <i class="fas fa-headset"></i>
        </div>
        <div class="chat-contenedor">
            <div class="chat-contenedor-support">
                <div class="chat-support-imagen"><img src="img.jpg" alt="Juan"></div>
                <div class="chat-support-nombre">Juan Almada</div>
                <div class="spinner">
                    <div class="bounce1"></div>
                    <div class="bounce2"></div>
                    <div class="bounce3"></div>
                </div>
            </div>
            <div class="chat-contenedor-mensajes">
                <div class="chat-mensaje emisor">
                    <img src="user.jpg" alt="Analberto">
                    <p>asdasd ad as das </p>
                </div>
                <div class="chat-mensaje receptor">
                    <img src="img.jpg" alt="Juan">
                    <p>Mira que bueno</p>
                </div>
            </div>
            <div class="chat-contenedor-enviar">
                <input type="text" placeholder="Mensaje"/>
                <button><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    </div>

    <div class="chat-mensaje emisor"> 
        <img src="user.jpg" alt="Analberto"/> 
        <p>asdasd ad as das </p> 
    </div> 
    <div class="chat-mensaje receptor"> 
        <img src="user.jpg" alt="Administrador"/> 
        <p>Mira que bueno</p> 
    </div>
    */