# getUserMedia(): Try HD! - Browser Extension

This browser extension attempts to fix a problem I've experienced on some video-calling sites (specifically, Zoom/WhereBy/Google-Meet), where their web clients don't properly ask for HD (1280x720 or 1920x1080) resolution from your camera, and in some cases (like mine) it results in squished/distorted video instead of just nice cropping.

This extension patches the built-in `getUserMedia(..)` API to intercept these kinds of calls and to force a request for 1280x720. Thus, if your camera supports that 16:9 HD aspect ratio, a proper non-squished feed will be returned to the web client. If your camera only supports 4:3 aspect ratio, such as 1024x768 or 640x480, then the request should nicely downgrade for your camera and still provide non-squished (albeit not-HD aspect ratio) video for your calls.

By default, the settings for this extension only apply the patch to Zoom/WhereBy/Google-Meet sites. You can change the settings to apply to different sites. There's also a handy enable/disable toggle switch if you want to quickly turn off the extension temporarily without actually uninstalling it.

## License

All code and documentation are (c) 2020 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/). A copy of the MIT License [is also included](LICENSE.txt).
