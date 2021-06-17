const WMF2PNG = (() => {

function WMF2PNG_()
{
}

WMF2PNG_.prototype.getBase64 = async function(file)
{
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => {
          res(reader.result);
        };
        reader.readAsDataURL(file);
    });
};

WMF2PNG_.prototype.getPNG = async function(file)
{
    if (typeof file === "string") {
        const base64 = file.replace(/.*;base64,/, '');
        return this.transformWMF(base64);
    }
    const src = await this.getBase64(file);
    const base64 = src.replace(/.*;base64,/, '');
    return this.transformWMF(base64);
};

WMF2PNG_.prototype.transformWMF = function(base64)
{
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = rawData.length - 1; i >= 0; --i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    let pNum = 0;
    let scale = 1;
    let wrt = new ToContext2D(pNum, scale);
    FromWMF.Parse(outputArray, wrt);
    let canvas = wrt.canvas;
    let { width, height } = canvas;
    let ctx = canvas.getContext('2d');
    let { data } = ctx.getImageData(0, 0, width, height);
    let row_len = width * 4;
    let col_len = height;
    let arr = [];
    for (let i = 0; i < col_len; i++) {
        let per_arr = data.slice(i * row_len, (i + 1) * row_len)
        arr.push(per_arr)
    }
    var canvas2 = document.createElement('canvas');
    canvas2.width = width
    canvas2.height = height
    let ctx2 = canvas2.getContext('2d');
    let n = row_len * col_len
    let arr2 = new Uint8ClampedArray(n)
    let curr_row = 0;
    let len = arr.length;
    for (let i = len - 1; i >= 0; i--) {
        let curr_row = arr[i]
        for (let j = 0; j < curr_row.length; j++) {
            arr2[(len - i) * row_len + j] = curr_row[j]
        }
    }
    let imageData = new ImageData(arr2, width, height)
    ctx2.putImageData(imageData, 0, 0)
    let dataurl = canvas2.toDataURL()
    let img = new Image()
    img.src = dataurl
    img.width = width
    img.height = height
    return img.outerHTML;
};

return new WMF2PNG_();

})();
