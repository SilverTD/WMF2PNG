const file = document.getElementById('files');
const btn = document.getElementById('convert');

btn.onclick = async function() {
    const base64 = document.getElementById('base64').value;
    const png = await WMF2PNG.getPNG(base64);
    document.getElementById('img').innerHTML = png;
    base64.value = "";
}

file.onchange = async function() {
    const png = await WMF2PNG.getPNG(file.files[0]);
    document.getElementById('img').innerHTML = png;
}
