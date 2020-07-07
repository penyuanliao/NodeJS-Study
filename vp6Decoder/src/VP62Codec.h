//
//  VP62Codec.hpp
//  GUI
//
//  Created by penyuan on 2016/8/5.
//  Copyright © 2016年 penyuan.liao. All rights reserved.
//

#ifndef VP62Codec_h
#define VP62Codec_h
#include <stdio.h>


#include "fxVP62.h"

typedef struct {
    unsigned char* buf;
    unsigned long  length;
}buffer;

typedef struct {
    fxVP62 *onVP62;
    unsigned char* playload;
    unsigned long size;
    int timeStamp, lastTimeStamp;
    long frameNumber;
    int skipIntra;
    int afap;
    char key;
    int streamID;
    buffer cxtBuf;
    long onread;
    int width, height;
    unsigned char* curImage;
    bool outputRGBAEnabled;
    bool playing;
}fxDecoder;

extern "C"
{
    /** 初始化 **/
    fxDecoder* fxdecoder();
    /** 建立新的Buffer **/
    unsigned char* createStream(fxDecoder *codec, long size);
    
    void setDecode(fxDecoder *codec, unsigned char* buf, int size);
    /**buffer slice is read**/
    void bufferSlice(fxDecoder *codec);

    void displayNextFrame(fxDecoder *codec, unsigned char* target);
    
    // nonblock js function
    void onHeadersDecoded();
    // nonblock js function
    void onPictureDecoded(unsigned char *buffer, unsigned short width, unsigned short height);
    /** stream function **/
    void setStreamDecode(fxDecoder *codec, unsigned char* buf, int size);
    void vp62Decoder2RGB(fxDecoder *codec, unsigned char *buf, unsigned long size, unsigned char* target); // del

    void startDecode(fxDecoder *codec);
    
    /** settings **/
    void setOutputRGBA(fxDecoder *codec, bool mode);
    void release(fxDecoder *codec);
}

//void FLVDecoder(unsigned char* buf);



#endif /* VP62Codec_h */
