# WMF2PNG .wmf to .png

## What is a WMF File?
`.WMF` is short for Windows Metafile. This image format was designed by Microsoft in the 1990s for their Windows Operating System. WMF files contain both vector graphics and raster components at the same time. It includes sort of programming commands which enables the creation of lines, circles, and rectangles on the viewing applications. This 16-bit image format is portable between applications. Also, WMF is the native vector format of Microsoft Office applications (MS Word, MS PowerPoint and MS Publisher). This format is also supported in PaintShop Pro.

## What is a PNG File?
`.PNG` stands for “Portable Graphics Format”. It is the most frequently used uncompressed raster image format on the internet. This lossless data compression format was created to replace the Graphics Interchange Format (GIF). PNG file format is an open format with no copyright limitations. Like GIF images, PNG also have the ability to display transparent backgrounds. In addition to that, PNG files are capable of containing 24bit RGB color palettes and greyscale images. Basically, this image format was designed to transfer images on the internet but with PaintShop Pro, PNG files can be applied with lots of editing effects.

## What is WMF2PNG?
WMF2PNG is designed to convert .wmf images to .png images.

## How to use it ?
To use it you need to download [`WMF2PNG.min.js`](WMF2PNG.min.js) file and connect it to your html file, then add this code to your js file:

```javascript
WMF2PNG.getPNG(file) // <--- .wmf image or .wmf base64 string
.then((result) => console.log(result)); // <--- png image
```
