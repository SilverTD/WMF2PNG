# WMF2PNG .wmf to .png

WMF2PNG is designed to convert ``.wmf`` to ``.png`` image.

So to convert ``.wmf`` image to ``.png`` image, you need to download [`WMF2PNG.min.js`](WMF2PNG.min.js) file then connect to html and finally type below code:

```javascript
WMF2PNG.getPNG(file) // <--- .wmf image
.then((result) => console.log(result)); // <--- this is png image

```
```javascript
const result = await WMF2PNG.getPNG(file); // <--- .wmf image
console.log(result); // <--- this is png image
```
And you can also use base64 wmf.

```javascript
WMF2PNG.getPNG(src) // <--- .wmf base64 string
.then((result) => console.log(result)); // <--- this is png image

```
```javascript
const result = await WMF2PNG.getPNG(src); // <--- .wmf base64 string
console.log(result); // <--- this is png image
```
