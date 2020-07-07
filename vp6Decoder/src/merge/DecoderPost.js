






         return Module;

     }
     )();

     var resultModule = Module || window.Module;
     //** 名稱要跟emscription library.js 一樣
     resultModule._onHeadersDecoded = onHeadersDecoded; // C call JS func
     resultModule._onPictureDecoded = onPictureDecoded; // C call JS func

     return resultModule;

 };


    // source code start //
    return (function () {
        "use strict";

        var uptime = function () {
            return new Date().getTime();
        };

        var Decoder = function (opts){
            /** 初始化設定 **/
            this.options = opts || {};
            /** 開始時間 **/
            this.now = uptime;

            var asmInstance;

            var fakeWindow = {};

            var onPicFun = function ($buffer, width, height) {
                // memory id to key
                var buffer = this.pictureBuffers[$buffer];

                if (!buffer) {
                    console.info('** onPicFun ** Init pictureBuffer() toU8Array');
                    buffer = this.pictureBuffers[$buffer] = toU8Array($buffer, (width * height * 3) / 2);
                }

                var infos;
                var doInfo = false;
                if (this.infoAr.length){
                    doInfo = true;
                    infos = this.infoAr;
                };
                this.infoAr = [];
                if (this.options.rgb){
                    if (!asmInstance){
                        asmInstance = getAsm(width, height);
                    };
                    asmInstance.inp.set(buffer);
                    asmInstance.doit();

                    var copyU8 = new Uint8Array(asmInstance.outSize);
                    copyU8.set( asmInstance.out );

                    if (doInfo){
                        infos[0].finishDecoding = uptime();
                    };
                    this.onPictureDecoded($buffer, width, height, infos);
                    return;

                };

                if (doInfo){
                    infos[0].finishDecoding = nowValue();
                };

                this.onPictureDecoded(buffer, width, height, infos);

            }.bind(this); // onPicFun ended

            var onHeaderFun = function () {
                console.log('* onHeaderFun *');
            };

            /** VP6F **/
            // apply(target, [args]);
            var Module = getModule.apply(fakeWindow, [onHeaderFun, onPicFun]);


            var HEAP8 = Module.HEAP8;
            var HEAPU8 = Module.HEAPU8;
            var HEAP16 = Module.HEAP16;
            var HEAP32 = Module.HEAP32;

            var MAX_STREAM_BUFFER_LENGTH = 1024 * 1024 * 5;

            // constructor
            var api =  Module.api = Module._fxdecoder();
            // console.log('Module._fxdecoder()');

            /**
             * Creates a typed array from a HEAP8 pointer.
             **/
            function toU8Array(ptr, length) {
                return HEAPU8.subarray(ptr, ptr + length);
            }
            function toU32Array(ptr, length) {
                //var tmp = HEAPU8.subarray(ptr, ptr + (length * 4));
                return new Uint32Array(HEAPU8.buffer, ptr, length);
            };
            Module._createStream(api, MAX_STREAM_BUFFER_LENGTH);
            this.streamBuffer = Module._malloc(MAX_STREAM_BUFFER_LENGTH);
            this.pictureBuffers = {};

            this.infoAr = [];
            // 輸出圖片function
            this.onPictureDecoded = function (buffer, width, height, infos) {

            };


            // var ptr_rgb = Module._malloc(942080); //remove

            // ----- 作用尚未確認
            var sliceNum = 0;
            if (this.options.sliceMode) { }
            else { }

            this.decode = function decode(typedAr, parInfo) {
                // console.info("Decoding: " + typedAr.length);
                if (parInfo){
                    this.infoAr.push(parInfo);
                    // parInfo.startDecoding = nowValue();
                };

                HEAPU8.set(typedAr, this.streamBuffer);
                Module._setDecode(api, this.streamBuffer , typedAr.length);

                var result = Module._displayNextFrame(api, null);

                // var imgBuf = Module.HEAPU8.subarray(ptr_rgb, ptr_rgb + 942080);

                // this.onPictureDecoded(imgBuf, 640, 368, null);
            }

            this.onCleanUp = function () {

                // Module._release(api);
                // this.pictureBuffers = {};
                // api =  Module.api = Module._fxdecoder();

            };


            function yuv2rgbcalc(y, u, v){
                y = y|0;
                u = u|0;
                v = v|0;

                var r = 0;
                var g = 0;
                var b = 0;

                var o = 0;

                var a0 = 0;
                var a1 = 0;
                var a2 = 0;
                var a3 = 0;
                var a4 = 0;

                a0 = imul(1192, (y - 16)|0)|0;
                a1 = imul(1634, (v - 128)|0)|0;
                a2 = imul(832, (v - 128)|0)|0;
                a3 = imul(400, (u - 128)|0)|0;
                a4 = imul(2066, (u - 128)|0)|0;

                r = (((a0 + a1)|0) >> 10)|0;
                g = (((((a0 - a2)|0) - a3)|0) >> 10)|0;
                b = (((a0 + a4)|0) >> 10)|0;

                if ((((r & 255)|0) != (r|0))|0){
                    r = min(255, max(0, r|0)|0)|0;
                };
                if ((((g & 255)|0) != (g|0))|0){
                    g = min(255, max(0, g|0)|0)|0;
                };
                if ((((b & 255)|0) != (b|0))|0){
                    b = min(255, max(0, b|0)|0)|0;
                };

                o = 255;
                o = (o << 8)|0;
                o = (o + b)|0;
                o = (o << 8)|0;
                o = (o + g)|0;
                o = (o << 8)|0;
                o = (o + r)|0;

                return o|0;

            };//end yuv2rgbcalc();



        };

        Decoder.prototype = {

        };

        /** asm.js implementation of a yuv to rgb convertor **/
        /** factory to create asm.js yuv -> rgb convertor for a given resolution **/
        var asmInstances = {};
        var getAsm = function(parWidth, parHeight){
            var idStr = "" + parWidth + "x" + parHeight;
            if (asmInstances[idStr]){
                return asmInstances[idStr];
            };

            var lumaSize = parWidth * parHeight;
            var chromaSize = (lumaSize|0) >> 2;

            var inpSize = lumaSize + chromaSize + chromaSize;
            var outSize = parWidth * parHeight * 4;
            var cacheSize = Math.pow(2, 24) * 4;
            var size = inpSize + outSize + cacheSize;

            var chunkSize = Math.pow(2, 24);
            var heapSize = chunkSize;
            while (heapSize < size){
                heapSize += chunkSize;
            };
            var heap = new ArrayBuffer(heapSize);

            var res = asmFactory(global, {}, heap);
            res.init(parWidth, parHeight);
            asmInstances[idStr] = res;

            res.heap = heap;
            res.out = new Uint8Array(heap, 0, outSize);
            res.inp = new Uint8Array(heap, outSize, inpSize);
            res.outSize = outSize;

            return res;
        };
        function asmFactory(stdlib, foreign, heap) {
            "use asm";

            var imul = stdlib.Math.imul;
            var min = stdlib.Math.min;
            var max = stdlib.Math.max;
            var pow = stdlib.Math.pow;
            var out = new stdlib.Uint8Array(heap);
            var out32 = new stdlib.Uint32Array(heap);
            var inp = new stdlib.Uint8Array(heap);
            var mem = new stdlib.Uint8Array(heap);
            var mem32 = new stdlib.Uint32Array(heap);

            // for double algo
            /*var vt = 1.370705;
             var gt = 0.698001;
             var gt2 = 0.337633;
             var bt = 1.732446;*/

            var width = 0;
            var height = 0;
            var lumaSize = 0;
            var chromaSize = 0;
            var inpSize = 0;
            var outSize = 0;

            var inpStart = 0;
            var outStart = 0;

            var widthFour = 0;

            var cacheStart = 0;


            function init(parWidth, parHeight){
                parWidth = parWidth|0;
                parHeight = parHeight|0;

                var i = 0;
                var s = 0;

                width = parWidth;
                widthFour = imul(parWidth, 4)|0;
                height = parHeight;
                lumaSize = imul(width|0, height|0)|0;
                chromaSize = (lumaSize|0) >> 2;
                outSize = imul(imul(width, height)|0, 4)|0;
                inpSize = ((lumaSize + chromaSize)|0 + chromaSize)|0;

                outStart = 0;
                inpStart = (outStart + outSize)|0;
                cacheStart = (inpStart + inpSize)|0;

                // initializing memory (to be on the safe side)
                s = ~~(+pow(+2, +24));
                s = imul(s, 4)|0;

                for (i = 0|0; ((i|0) < (s|0))|0; i = (i + 4)|0){
                    mem32[((cacheStart + i)|0) >> 2] = 0;
                };
            };

            function doit(){
                var ystart = 0;
                var ustart = 0;
                var vstart = 0;

                var y = 0;
                var yn = 0;
                var u = 0;
                var v = 0;

                var o = 0;

                var line = 0;
                var col = 0;

                var usave = 0;
                var vsave = 0;

                var ostart = 0;
                var cacheAdr = 0;

                ostart = outStart|0;

                ystart = inpStart|0;
                ustart = (ystart + lumaSize|0)|0;
                vstart = (ustart + chromaSize)|0;

                for (line = 0; (line|0) < (height|0); line = (line + 2)|0){
                    usave = ustart;
                    vsave = vstart;
                    for (col = 0; (col|0) < (width|0); col = (col + 2)|0){
                        y = inp[ystart >> 0]|0;
                        yn = inp[((ystart + width)|0) >> 0]|0;

                        u = inp[ustart >> 0]|0;
                        v = inp[vstart >> 0]|0;

                        cacheAdr = (((((y << 16)|0) + ((u << 8)|0))|0) + v)|0;
                        o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
                        if (o){}else{
                            o = yuv2rgbcalc(y,u,v)|0;
                            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
                        };
                        mem32[ostart >> 2] = o;

                        cacheAdr = (((((yn << 16)|0) + ((u << 8)|0))|0) + v)|0;
                        o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
                        if (o){}else{
                            o = yuv2rgbcalc(yn,u,v)|0;
                            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
                        };
                        mem32[((ostart + widthFour)|0) >> 2] = o;

                        //yuv2rgb5(y, u, v, ostart);
                        //yuv2rgb5(yn, u, v, (ostart + widthFour)|0);
                        ostart = (ostart + 4)|0;

                        // next step only for y. u and v stay the same
                        ystart = (ystart + 1)|0;
                        y = inp[ystart >> 0]|0;
                        yn = inp[((ystart + width)|0) >> 0]|0;

                        //yuv2rgb5(y, u, v, ostart);
                        cacheAdr = (((((y << 16)|0) + ((u << 8)|0))|0) + v)|0;
                        o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
                        if (o){}else{
                            o = yuv2rgbcalc(y,u,v)|0;
                            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
                        };
                        mem32[ostart >> 2] = o;

                        //yuv2rgb5(yn, u, v, (ostart + widthFour)|0);
                        cacheAdr = (((((yn << 16)|0) + ((u << 8)|0))|0) + v)|0;
                        o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
                        if (o){}else{
                            o = yuv2rgbcalc(yn,u,v)|0;
                            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
                        };
                        mem32[((ostart + widthFour)|0) >> 2] = o;
                        ostart = (ostart + 4)|0;

                        //all positions inc 1

                        ystart = (ystart + 1)|0;
                        ustart = (ustart + 1)|0;
                        vstart = (vstart + 1)|0;
                    };
                    ostart = (ostart + widthFour)|0;
                    ystart = (ystart + width)|0;

                };

            };

            function yuv2rgbcalc(y, u, v){
                y = y|0;
                u = u|0;
                v = v|0;

                var r = 0;
                var g = 0;
                var b = 0;

                var o = 0;

                var a0 = 0;
                var a1 = 0;
                var a2 = 0;
                var a3 = 0;
                var a4 = 0;

                a0 = imul(1192, (y - 16)|0)|0;
                a1 = imul(1634, (v - 128)|0)|0;
                a2 = imul(832, (v - 128)|0)|0;
                a3 = imul(400, (u - 128)|0)|0;
                a4 = imul(2066, (u - 128)|0)|0;

                r = (((a0 + a1)|0) >> 10)|0;
                g = (((((a0 - a2)|0) - a3)|0) >> 10)|0;
                b = (((a0 + a4)|0) >> 10)|0;

                if ((((r & 255)|0) != (r|0))|0){
                    r = min(255, max(0, r|0)|0)|0;
                };
                if ((((g & 255)|0) != (g|0))|0){
                    g = min(255, max(0, g|0)|0)|0;
                };
                if ((((b & 255)|0) != (b|0))|0){
                    b = min(255, max(0, b|0)|0)|0;
                };

                o = 255;
                o = (o << 8)|0;
                o = (o + b)|0;
                o = (o << 8)|0;
                o = (o + g)|0;
                o = (o << 8)|0;
                o = (o + r)|0;

                return o|0;

            };



            return {
                init: init,
                doit: doit
            };
        };

        /** potential worker initialization **/

        
        if (typeof self != "undefined") {
            var isWorker = false;
            var decoder;
            var reuseMemory = false;
            var memAr = [];
            var getMem = function(length){
                if (memAr.length){
                    var u = memAr.shift();
                    while (u && u.byteLength !== length){
                        u = memAr.shift();
                    };
                    if (u){
                        return u;
                    };
                };
                return new ArrayBuffer(length);
            };

            self.addEventListener('message', function(e) {

                if (isWorker){
                    if (reuseMemory){
                        if (e.data.reuse){
                            memAr.push(e.data.reuse);
                        };
                    };
                    if (e.data.buf){
                        decoder.decode(new Uint8Array(e.data.buf, e.data.offset || 0, e.data.length), e.data.info);
                    };

                }else{
                    if (e.data && e.data.type === "Broadway.js - Worker init"){
                        isWorker = true;
                        decoder = new Decoder(e.data.options);

                        if (e.data.options.reuseMemory){
                            reuseMemory = true;
                            decoder.onPictureDecoded = function (buffer, width, height, infos) {

                                //var buf = getMem();

                                // buffer needs to be copied because we give up ownership
                                var copyU8 = new Uint8Array(getMem(buffer.length));
                                copyU8.set( buffer, 0, buffer.length );

                                postMessage({
                                    buf: copyU8.buffer,
                                    length: buffer.length,
                                    width: width,
                                    height: height,
                                    infos: infos
                                }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership

                            };

                        }else{
                            decoder.onPictureDecoded = function (buffer, width, height, infos) {
                                if (buffer) {
                                    buffer = new Uint8Array(buffer);
                                };

                                // buffer needs to be copied because we give up ownership
                                var copyU8 = new Uint8Array(buffer.length);
                                copyU8.set( buffer, 0, buffer.length );

                                postMessage({
                                    buf: copyU8.buffer,
                                    length: buffer.length,
                                    width: width,
                                    height: height,
                                    infos: infos
                                }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership

                            };
                        };
                        postMessage({ consoleLog: "broadway worker initialized" });
                    };
                };


            }, false);



        };

        Decoder.uptime = uptime;

        return Decoder;

    })();
    // source code ended //

}));
