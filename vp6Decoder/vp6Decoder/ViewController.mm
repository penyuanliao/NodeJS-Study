//
//  ViewController.m
//  vp6Decoder
//
//  Created by penyuan on 2016/8/23.
//  Copyright © 2016年 penyuan.liao. All rights reserved.
//
#import <Foundation/Foundation.h>
#include <fstream>   // file I/O
#import "ViewController.h"
#include "VP62Codec.h"

struct sBuffer
{
    unsigned char *buf;
    long size;
};
struct videoInfos
{
    int width;
    int height;
    int fps;
};

NSImageView     *_imageView;
fxDecoder       *codec;
NSTimer         *st;
unsigned char   *RGBImg;
videoInfos      vInfo;
int             count = 0;


@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    

    // Do any additional setup after loading the view.
    
    [self setupVideoView];
    
    sBuffer buf = [self loadFileWithName:@"rtmpData" ofType:@"JSON"];
    
    codec = fxdecoder();
    
    createStream(codec, 1024 * 1024 * 20);
    
    setDecode(codec, buf.buf, (int)buf.size);
    
    vInfo.width  = 1280;
    vInfo.height = 720;
    printf("video->width: %d \nvideo->height: %d\n", codec->width, codec->height);
//    [self displayNextFrame:NULL];
//    return;
    st = [NSTimer scheduledTimerWithTimeInterval:0.1
                                          target:self
                                        selector:@selector(displayNextFrame:)
                                        userInfo:nil
                                         repeats:YES];/**/
}

- (void)setRepresentedObject:(id)representedObject {
    [super setRepresentedObject:representedObject];

    // Update the view, if already loaded.
}

- (void)setupVideoView {
    _imageView = [[NSImageView alloc] initWithFrame:NSMakeRect(0, 100, 1280, 720)];
//    [_imageView setImageAlignment:NSImageAlign];
    [self.view addSubview:_imageView];
}

/** Next Frame Data **/
- (void)displayNextFrame:(NSTimer *)timer {
//    int isize = vInfo.width * vInfo.height * 4;
//    printf("RGB Image Size:%d\n", isize);
    codec->outputRGBAEnabled = false; //轉換RGBA Data
    displayNextFrame(codec, codec->curImage);
    bufferSlice(codec);
//    [self drawingPictureTo:codec->curImage w:codec->width h:codec->height];
    
    
//    if (count++ >= 300) {
//        [timer invalidate];
//        timer = nil;
//    }
}
/** 繪圖RGBA **/
- (void)drawingPictureTo:(unsigned char *)image w:(int)w h:(int)h {
    CGColorSpaceRef colorSpace=CGColorSpaceCreateDeviceRGB();
    CGContextRef bitmapContext=CGBitmapContextCreate(image, w, h, 8, 4*w, colorSpace,  kCGImageAlphaPremultipliedLast);
    CFRelease(colorSpace);
//    free(image);
    CGImageRef cgImage=CGBitmapContextCreateImage(bitmapContext);
    CGContextRelease(bitmapContext);
    NSSize size;
    size.width = w;
    size.height = h;
    NSImage * newimage = [[NSImage alloc]initWithCGImage:cgImage size:size];
    CGImageRelease(cgImage);
    
    [_imageView setImage:newimage];
    [_imageView setImageScaling:NSImageScaleNone];
    newimage = NULL;
}
- (void)imageFromChar:(unsigned char *)pixel width:(int)width height:(int)height {
    
}
//- (void)drawingPictureYUVTo:(unsigned char *)image w:(int)w h:(int)h {
//}
- (sBuffer)loadFileWithName:(NSString *)name ofType:(NSString *)type {
    NSBundle *mainBundle = [NSBundle mainBundle];
    const char *filePath = [[mainBundle pathForResource:name ofType:type] UTF8String];
    
    return [self openFile:filePath];
    
}
- (sBuffer) openFile:(const char *)name {
    FILE *infile = fopen(name, "rb");
    if (infile == NULL) {
        printf("Failed to open file %s.\n", name);
        exit(1);
    }
    fseek(infile, 0, SEEK_END);
    unsigned long filelen = ftell(infile);
    rewind(infile);
    
    unsigned char *getData = (unsigned char *)malloc((filelen+1)*sizeof(char));
    fread(getData, sizeof(unsigned char), filelen, infile);
    
    sBuffer data;
    data.buf = getData;
    data.size = filelen;
    
    return data;
}

@end
