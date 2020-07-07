//
//  VP62Codec.cpp
//  GUI
//
//  Created by penyuan on 2016/8/5.
//  Copyright © 2016年 penyuan.liao. All rights reserved.
//
#include "VP62Codec.h"
#define u8  unsigned char
#define u16 unsigned short
#define u32 unsigned long

#define AUDIO_TYPE      8
#define VIDEO_TYPE      9
#define METADATA_TYPE   18

#define KEY_FRAME               1
#define INTER_FRAME             2
#define DISPOSABLE_INTER_FRAME  3
#define GENERATED_KEY_FRAME     4
#define COMMAND_FRAME           5

// CODEC_ID
#define H263           2
#define SCREEN_VIDEO   3
#define ON2_VP6        4
#define ON2_VP62       5 // with alpha channel
#define SCREEN_VIDEO2  6
#define AVC            7


#define TagHeaderSize 11


// clips a value between [0,255] using fast bitwise operations
#define CLIP_RGB_COLOR(x) ((x & 0xFFFFFF00) == 0 ? x : (x & 0x80000000 ? 0 : 255))


extern "C" fxDecoder* fxdecoder() {
    printf("+++++ setupFLV VP62Codec +++++ \n");
    printf("2016.09.06 Penyuan.Liao emscription build C form JavaScript Project.\n");
    
    fxDecoder *codec = new fxDecoder();
    codec->size = 100;
    codec->onVP62 = new fxVP62();
    
    codec->onVP62->testValue = 0;
    codec->outputRGBAEnabled = true;
    codec->playing = false;
    
    return codec;
}

extern "C" unsigned char* createStream(fxDecoder *codec, long size) {
    codec->cxtBuf.buf = (unsigned char *) malloc(size*sizeof(unsigned char));
    codec->cxtBuf.length = 0;
    return codec->cxtBuf.buf;
}

extern "C" void setDecode(fxDecoder *codec, unsigned char* buf, int size) {
    
    if (codec->cxtBuf.buf == NULL) {
        const int msize = 1024 * 1024 * 4;
        printf("warning - This step does not yet materialize memory buffer, could be create %dkb memory.", msize/1024);
        createStream(codec, msize);
    }
    if (codec->cxtBuf.length == 0 && (buf[0] == 70 && buf[1] == 76 && buf[2] == 86)) {
        memcpy(codec->cxtBuf.buf, buf + 13, size);
        codec->cxtBuf.length = size -13;
        codec->onread = 0;
        
    }else
    {
        bufferSlice(codec);
        memcpy(codec->cxtBuf.buf + codec->cxtBuf.length, buf, size);
        codec->cxtBuf.length += size;
    }
}
/** 移除使用過的memory  **/
extern "C" void bufferSlice(fxDecoder *codec) {
    long end = codec->onread;
    memcpy(codec->cxtBuf.buf, codec->cxtBuf.buf + end, codec->cxtBuf.length);
    codec->cxtBuf.length = codec->cxtBuf.length - end;
    codec->onread = 0;
}
/** nonblock js function **/
extern "C" {
    extern void onHeadersDecoded();
}
/** nonblock js function **/
extern "C" {
    extern void onPictureDecoded(unsigned char *buffer, unsigned short width, unsigned short height);
}
/** get next frame to picture **/
extern "C" void displayNextFrame(fxDecoder *codec, unsigned char* target) {
    codec->playing = true;
    if (1)
    {
        int tagType;
        
        unsigned char *buf = codec->cxtBuf.buf;
        
        tagType = buf[codec->onread++]; // read one byte (1)
        if (tagType < 0) {
            printf("TagType EOF!!\n");
            return; // EOF
        }
        //videoStream Size
        codec->size  = buf[codec->onread++]; codec->size <<= 8; // (2)
        codec->size |= buf[codec->onread++]; codec->size <<= 8; // (3)
        codec->size |= buf[codec->onread++]; // (4)
        
        if (tagType == 0) {
//            printf("Pre Tag Size:%ld\n", codec->size);
            return;
        }
        
        codec->timeStamp = buf[codec->onread++];   codec->timeStamp <<= 8; // (5)
        codec->timeStamp |= buf[codec->onread++];  codec->timeStamp <<= 8; // (6)
        codec->timeStamp |= buf[codec->onread++];  codec->timeStamp <<= 8; // (7)
        codec->timeStamp |= buf[codec->onread++]; // (8)
        
        codec->streamID = buf[codec->onread++]; codec->streamID <<= 8; // (9)
        codec->streamID |= buf[codec->onread++]; codec->streamID <<= 8;// (10)
        codec->streamID |= buf[codec->onread++]; // (11)
        
        if (tagType == VIDEO_TYPE) {
            
            //------------------------------//
            //            Tag Data          //
            //------------------------------//
            int flag;
            int codecType;
            int frameType;
            int width, height;
            int ok;
            
            //-------- video codec ---------//
            flag = buf[codec->onread++];
            codecType = flag & 0xf;
            frameType = flag >> 4;
            ok = 0;
            
            codec->size--;
            codec->playload = (unsigned char*)malloc(codec->size);
            memcpy(codec->playload, buf+codec->onread, codec->size); // 0.5 - 1% CPU usage
            codec->onread += codec->size;
            codec->frameNumber++;
            
            if (codecType == H263) {
                printf("H263 Not support !!\n");
                exit(0);
            }
            if (codecType == SCREEN_VIDEO || codecType == SCREEN_VIDEO2) {
                printf("Screen video Not support !!\n");
                exit(0);
            }
            if (codecType == ON2_VP6 || codecType == ON2_VP62) {
                
                fxVP62 *onVP62 = codec->onVP62;
                onVP62->decodePacket(codec->playload + 1, (int)codec->size); // 11 - 12% CPU usage
                
                // create once image memory
                if (codec->curImage == NULL) {
                    
                    onVP62->getImageSize(&width, &height);
                    codec->width = width;
                    codec->height = height;
                    int msize = (width * height * 4);
                    codec->curImage = (unsigned char*)malloc(msize);
                    printf("** init curImage width:%d, height:%d, memsize:%d **\n", width, height, msize);

                }
                
#ifndef EMIT_IMAGE_ASAP
                
                onVP62->getYUV2(codec->curImage);
                
                onPictureDecoded(codec->curImage, width, height);
#else
                if (target != NULL) {
                    
                    if (codec->outputRGBAEnabled) {
                        onVP62->getRGB(target);
                    }
                    else{
                        onVP62->getYUV2(target);
                    }
                }
#endif
                free(codec->playload);
                return;
            }
            
        } else if (tagType == METADATA_TYPE){
            codec->onread+= codec->size;
            printf("METADATA_TYPE Data size:%ld api->size:%ld.\n", codec->onread, codec->size);
        }
        
    }
    
    return;
};

extern "C" void setStreamDecode(fxDecoder *codec, unsigned char* buf, int size) {
    
    if (codec->cxtBuf.length == 0) {
        memcpy(codec->cxtBuf.buf, buf, size);
        codec->cxtBuf.length = size;
        codec->onread = 0;
        
    }else
    {
        memcpy(codec->cxtBuf.buf, codec->cxtBuf.buf + codec->onread, codec->cxtBuf.length);
        codec->cxtBuf.length = codec->cxtBuf.length - codec->onread;
        codec->onread = 0;
        
        memcpy(codec->cxtBuf.buf + codec->cxtBuf.length, buf, size);
        codec->cxtBuf.length += size;
    }
}
extern "C" void vp62Decoder2RGB(fxDecoder *codec, unsigned char *buf, unsigned long size, unsigned char* target) {
    int width, height;
    codec->size = size;
    codec->playload = (unsigned char*)malloc(codec->size);
    memcpy(codec->playload, buf, codec->size);
    fxVP62 *onVP62 = codec->onVP62;
    onVP62->decodePacket(codec->playload + 1, (int)codec->size);
    onVP62->getImageSize(&width, &height);
    codec->width  = width;
    codec->height = height;
    printf("width:%d, height:%d, memsize:%d \n", width, height, (height * width * 4));
    onVP62->getRGB(target);
}

/** settings **/
extern "C" void setOutputRGBA(fxDecoder *codec, bool mode) {
    codec->outputRGBAEnabled = mode;
}
extern "C" void release(fxDecoder *codec) {
//    free(codec->playload);
//    codec->playload = NULL;
//    free(codec->cxtBuf.buf);
//    codec->cxtBuf.buf = NULL;
    codec->cxtBuf.length = 0;
    free(codec->curImage);
    codec->curImage = NULL;
    codec->onread = 0;
//    free(codec);
    codec = NULL;
}

